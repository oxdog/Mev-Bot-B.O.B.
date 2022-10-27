'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.V3QuoteProvider =
  exports.ProviderGasError =
  exports.ProviderTimeoutError =
  exports.ProviderBlockHeaderError =
  exports.SuccessRateError =
  exports.BlockConflictError =
    void 0;
const bignumber_1 = require('@ethersproject/bignumber');
const v3_sdk_1 = require('@uniswap/v3-sdk');
const async_retry_1 = __importDefault(require('async-retry'));
const lodash_1 = __importDefault(require('lodash'));
const stats_lite_1 = __importDefault(require('stats-lite'));
const IQuoterV2__factory_1 = require('../../types/v3/factories/IQuoterV2__factory');
const util_1 = require('../../util');
const addresses_1 = require('../../util/addresses');
const log_1 = require('../../util/log');
const routes_1 = require('../../util/routes');
const util = require('util');

class BlockConflictError extends Error {
  constructor() {
    super(...arguments);
    this.name = 'BlockConflictError';
  }
}
exports.BlockConflictError = BlockConflictError;
class SuccessRateError extends Error {
  constructor() {
    super(...arguments);
    this.name = 'SuccessRateError';
  }
}
exports.SuccessRateError = SuccessRateError;
class ProviderBlockHeaderError extends Error {
  constructor() {
    super(...arguments);
    this.name = 'ProviderBlockHeaderError';
  }
}
exports.ProviderBlockHeaderError = ProviderBlockHeaderError;
class ProviderTimeoutError extends Error {
  constructor() {
    super(...arguments);
    this.name = 'ProviderTimeoutError';
  }
}
exports.ProviderTimeoutError = ProviderTimeoutError;
/**
 * This error typically means that the gas used by the multicall has
 * exceeded the total call gas limit set by the node provider.
 *
 * This can be resolved by modifying BatchParams to request fewer
 * quotes per call, or to set a lower gas limit per quote.
 *
 * @export
 * @class ProviderGasError
 */
class ProviderGasError extends Error {
  constructor() {
    super(...arguments);
    this.name = 'ProviderGasError';
  }
}
exports.ProviderGasError = ProviderGasError;
const DEFAULT_BATCH_RETRIES = 2;
/**
 * Computes quotes for V3. For V3, quotes are computed on-chain using
 * the 'QuoterV2' smart contract. This is because computing quotes off-chain would
 * require fetching all the tick data for each pool, which is a lot of data.
 *
 * To minimize the number of requests for quotes we use a Multicall contract. Generally
 * the number of quotes to fetch exceeds the maximum we can fit in a single multicall
 * while staying under gas limits, so we also batch these quotes across multiple multicalls.
 *
 * The biggest challenge with the quote provider is dealing with various gas limits.
 * Each provider sets a limit on the amount of gas a call can consume (on Infura this
 * is approximately 10x the block max size), so we must ensure each multicall does not
 * exceed this limit. Additionally, each quote on V3 can consume a large number of gas if
 * the pool lacks liquidity and the swap would cause all the ticks to be traversed.
 *
 * To ensure we don't exceed the node's call limit, we limit the gas used by each quote to
 * a specific value, and we limit the number of quotes in each multicall request. Users of this
 * class should set BatchParams such that multicallChunk * gasLimitPerCall is less than their node
 * providers total gas limit per call.
 *
 * @export
 * @class V3QuoteProvider
 */
class V3QuoteProvider {
  /**
   * Creates an instance of V3QuoteProvider.
   *
   * @param chainId The chain to get quotes for.
   * @param provider The web 3 provider.
   * @param multicall2Provider The multicall provider to use to get the quotes on-chain.
   * Only supports the Uniswap Multicall contract as it needs the gas limitting functionality.
   * @param retryOptions The retry options for each call to the multicall.
   * @param batchParams The parameters for each batched call to the multicall.
   * @param gasErrorFailureOverride The gas and chunk parameters to use when retrying a batch that failed due to out of gas.
   * @param successRateFailureOverrides The parameters for retries when we fail to get quotes.
   * @param blockNumberConfig Parameters for adjusting which block we get quotes from, and how to handle block header not found errors.
   * @param [quoterAddressOverride] Overrides the address of the quoter contract to use.
   */
  constructor(
    chainId,
    provider,
    // Only supports Uniswap Multicall as it needs the gas limitting functionality.
    multicall2Provider,
    retryOptions = {
      retries: DEFAULT_BATCH_RETRIES,
      minTimeout: 25,
      maxTimeout: 250,
    },
    batchParams = {
      multicallChunk: 150,
      gasLimitPerCall: 1000000,
      quoteMinSuccessRate: 0.2,
    },
    gasErrorFailureOverride = {
      gasLimitOverride: 1500000,
      multicallChunk: 100,
    },
    successRateFailureOverrides = {
      gasLimitOverride: 1300000,
      multicallChunk: 110,
    },
    blockNumberConfig = {
      baseBlockOffset: 0,
      rollback: { enabled: false },
    },
    quoterAddressOverride
  ) {
    this.chainId = chainId;
    this.provider = provider;
    this.multicall2Provider = multicall2Provider;
    this.retryOptions = retryOptions;
    this.batchParams = batchParams;
    this.gasErrorFailureOverride = gasErrorFailureOverride;
    this.successRateFailureOverrides = successRateFailureOverrides;
    this.blockNumberConfig = blockNumberConfig;
    this.quoterAddressOverride = quoterAddressOverride;
    const quoterAddress = quoterAddressOverride
      ? quoterAddressOverride
      : addresses_1.QUOTER_V2_ADDRESS;
    if (!quoterAddress) {
      throw new Error(
        `No address for Uniswap QuoterV2 Contract on chain id: ${chainId}`
      );
    }
    this.quoterAddress = quoterAddress;
  }
  async getQuotesManyExactIn(amountIns, routes, providerConfig) {
    return this.getQuotesManyData(
      amountIns,
      routes,
      'quoteExactInput',
      providerConfig
    );
  }
  async getQuotesManyExactOut(amountOuts, routes, providerConfig) {
    return this.getQuotesManyData(
      amountOuts,
      routes,
      'quoteExactOutput',
      providerConfig
    );
  }
  async getQuotesManyData(amounts, routes, functionName, _providerConfig) {
    // ! ########################
    // ! ########################
    console.log('v3 quotes');
    routes = routes.filter((_, i) => i < 10);

    var _a;
    let multicallChunk = this.batchParams.multicallChunk;
    let gasLimitOverride = this.batchParams.gasLimitPerCall;
    const { baseBlockOffset, rollback } = this.blockNumberConfig;
    // Apply the base block offset if provided
    const originalBlockNumber = await this.provider.getBlockNumber();
    const providerConfig = Object.assign(Object.assign({}, _providerConfig), {
      blockNumber:
        (_a =
          _providerConfig === null || _providerConfig === void 0
            ? void 0
            : _providerConfig.blockNumber) !== null && _a !== void 0
          ? _a
          : originalBlockNumber + baseBlockOffset,
    });
    const inputs = lodash_1
      .default(routes)
      .flatMap((route) => {
        const encodedRoute = v3_sdk_1.encodeRouteToPath(
          route,
          functionName == 'quoteExactOutput' // For exactOut must be true to ensure the routes are reversed.
        );
        const routeInputs = amounts.map((amount) => [
          encodedRoute,
          `0x${amount.quotient.toString(16)}`,
        ]);
        return routeInputs;
      })
      .value();
    const normalizedChunk = Math.ceil(
      inputs.length / Math.ceil(inputs.length / multicallChunk)
    );
    const inputsChunked = lodash_1.default.chunk(inputs, normalizedChunk);
    let quoteStates = lodash_1.default.map(inputsChunked, (inputChunk) => {
      return {
        status: 'pending',
        inputs: inputChunk,
      };
    });
    log_1.log.info(
      `About to get ${
        inputs.length
      } quotes in chunks of ${normalizedChunk} [${lodash_1.default
        .map(inputsChunked, (i) => i.length)
        .join(',')}] ${
        gasLimitOverride
          ? `with a gas limit override of ${gasLimitOverride}`
          : ''
      } and block number: ${await providerConfig.blockNumber} [Original before offset: ${originalBlockNumber}].`
    );
    let haveRetriedForSuccessRate = false;
    let haveRetriedForBlockHeader = false;
    let blockHeaderRetryAttemptNumber = 0;
    let haveIncrementedBlockHeaderFailureCounter = false;
    let blockHeaderRolledBack = false;
    let haveRetriedForBlockConflictError = false;
    let haveRetriedForOutOfGas = false;
    let haveRetriedForTimeout = false;
    let haveRetriedForUnknownReason = false;
    let finalAttemptNumber = 1;
    const expectedCallsMade = quoteStates.length;
    let totalCallsMade = 0;
    const {
      results: quoteResults,
      blockNumber,
      approxGasUsedPerSuccessCall,
    } = await async_retry_1.default(async (_bail, attemptNumber) => {
      haveIncrementedBlockHeaderFailureCounter = false;
      finalAttemptNumber = attemptNumber;
      const [success, failed, pending] = this.partitionQuotes(quoteStates);
      log_1.log.info(`Starting attempt: ${attemptNumber}.
          Currently ${success.length} success, ${failed.length} failed, ${pending.length} pending.
          Gas limit override: ${gasLimitOverride} Block number override: ${providerConfig.blockNumber}.`);
      quoteStates = await Promise.all(
        lodash_1.default.map(quoteStates, async (quoteState, idx) => {
          if (quoteState.status == 'success') {
            return quoteState;
          }
          // QuoteChunk is pending or failed, so we try again
          const { inputs } = quoteState;
          try {
            totalCallsMade = totalCallsMade + 1;
            const results =
              await this.multicall2Provider.callSameFunctionOnContractWithMultipleParams(
                {
                  address: this.quoterAddress,
                  contractInterface:
                    IQuoterV2__factory_1.IQuoterV2__factory.createInterface(),
                  functionName,
                  functionParams: inputs,
                  providerConfig,
                  additionalConfig: {
                    gasLimitPerCallOverride: gasLimitOverride,
                  },
                }
              );
            const successRateError = this.validateSuccessRate(
              results.results,
              haveRetriedForSuccessRate
            );
            if (successRateError) {
              return {
                status: 'failed',
                inputs,
                reason: successRateError,
                results,
              };
            }
            return {
              status: 'success',
              inputs,
              results,
            };
          } catch (err) {
            // Error from providers have huge messages that include all the calldata and fill the logs.
            // Catch them and rethrow with shorter message.
            if (err.message.includes('header not found')) {
              return {
                status: 'failed',
                inputs,
                reason: new ProviderBlockHeaderError(err.message.slice(0, 500)),
              };
            }
            if (err.message.includes('timeout')) {
              return {
                status: 'failed',
                inputs,
                reason: new ProviderTimeoutError(
                  `Req ${idx}/${quoteStates.length}. Request had ${
                    inputs.length
                  } inputs. ${err.message.slice(0, 500)}`
                ),
              };
            }
            if (err.message.includes('out of gas')) {
              return {
                status: 'failed',
                inputs,
                reason: new ProviderGasError(err.message.slice(0, 500)),
              };
            }
            return {
              status: 'failed',
              inputs,
              reason: new Error(
                `Unknown error from provider: ${err.message.slice(0, 500)}`
              ),
            };
          }
        })
      );
      const [successfulQuoteStates, failedQuoteStates, pendingQuoteStates] =
        this.partitionQuotes(quoteStates);
      if (pendingQuoteStates.length > 0) {
        throw new Error('Pending quote after waiting for all promises.');
      }
      let retryAll = false;
      const blockNumberError = this.validateBlockNumbers(
        successfulQuoteStates,
        inputsChunked.length,
        gasLimitOverride
      );
      // If there is a block number conflict we retry all the quotes.
      if (blockNumberError) {
        retryAll = true;
      }
      const reasonForFailureStr = lodash_1.default
        .map(
          failedQuoteStates,
          (failedQuoteState) => failedQuoteState.reason.name
        )
        .join(', ');
      if (failedQuoteStates.length > 0) {
        log_1.log.info(
          `On attempt ${attemptNumber}: ${failedQuoteStates.length}/${quoteStates.length} quotes failed. Reasons: ${reasonForFailureStr}`
        );
        for (const failedQuoteState of failedQuoteStates) {
          const { reason: error } = failedQuoteState;
          log_1.log.info(
            { error },
            `[QuoteFetchError] Attempt ${attemptNumber}. ${error.message}`
          );
          if (error instanceof BlockConflictError) {
            if (!haveRetriedForBlockConflictError) {
              util_1.metric.putMetric(
                'QuoteBlockConflictErrorRetry',
                1,
                util_1.MetricLoggerUnit.Count
              );
              haveRetriedForBlockConflictError = true;
            }
            retryAll = true;
          } else if (error instanceof ProviderBlockHeaderError) {
            if (!haveRetriedForBlockHeader) {
              util_1.metric.putMetric(
                'QuoteBlockHeaderNotFoundRetry',
                1,
                util_1.MetricLoggerUnit.Count
              );
              haveRetriedForBlockHeader = true;
            }
            // Ensure that if multiple calls fail due to block header in the current pending batch,
            // we only count once.
            if (!haveIncrementedBlockHeaderFailureCounter) {
              blockHeaderRetryAttemptNumber = blockHeaderRetryAttemptNumber + 1;
              haveIncrementedBlockHeaderFailureCounter = true;
            }
            if (rollback.enabled) {
              const { rollbackBlockOffset, attemptsBeforeRollback } = rollback;
              if (
                blockHeaderRetryAttemptNumber >= attemptsBeforeRollback &&
                !blockHeaderRolledBack
              ) {
                log_1.log.info(
                  `Attempt ${attemptNumber}. Have failed due to block header ${
                    blockHeaderRetryAttemptNumber - 1
                  } times. Rolling back block number by ${rollbackBlockOffset} for next retry`
                );
                providerConfig.blockNumber = providerConfig.blockNumber
                  ? (await providerConfig.blockNumber) + rollbackBlockOffset
                  : (await this.provider.getBlockNumber()) +
                    rollbackBlockOffset;
                retryAll = true;
                blockHeaderRolledBack = true;
              }
            }
          } else if (error instanceof ProviderTimeoutError) {
            if (!haveRetriedForTimeout) {
              util_1.metric.putMetric(
                'QuoteTimeoutRetry',
                1,
                util_1.MetricLoggerUnit.Count
              );
              haveRetriedForTimeout = true;
            }
          } else if (error instanceof ProviderGasError) {
            if (!haveRetriedForOutOfGas) {
              util_1.metric.putMetric(
                'QuoteOutOfGasExceptionRetry',
                1,
                util_1.MetricLoggerUnit.Count
              );
              haveRetriedForOutOfGas = true;
            }
            gasLimitOverride = this.gasErrorFailureOverride.gasLimitOverride;
            multicallChunk = this.gasErrorFailureOverride.multicallChunk;
            retryAll = true;
          } else if (error instanceof SuccessRateError) {
            if (!haveRetriedForSuccessRate) {
              util_1.metric.putMetric(
                'QuoteSuccessRateRetry',
                1,
                util_1.MetricLoggerUnit.Count
              );
              haveRetriedForSuccessRate = true;
              // Low success rate can indicate too little gas given to each call.
              gasLimitOverride =
                this.successRateFailureOverrides.gasLimitOverride;
              multicallChunk = this.successRateFailureOverrides.multicallChunk;
              retryAll = true;
            }
          } else {
            if (!haveRetriedForUnknownReason) {
              util_1.metric.putMetric(
                'QuoteUnknownReasonRetry',
                1,
                util_1.MetricLoggerUnit.Count
              );
              haveRetriedForUnknownReason = true;
            }
          }
        }
      }
      if (retryAll) {
        log_1.log.info(
          `Attempt ${attemptNumber}. Resetting all requests to pending for next attempt.`
        );
        const normalizedChunk = Math.ceil(
          inputs.length / Math.ceil(inputs.length / multicallChunk)
        );
        const inputsChunked = lodash_1.default.chunk(inputs, normalizedChunk);
        quoteStates = lodash_1.default.map(inputsChunked, (inputChunk) => {
          return {
            status: 'pending',
            inputs: inputChunk,
          };
        });
      }
      if (failedQuoteStates.length > 0) {
        // TODO: Work with Arbitrum to find a solution for making large multicalls with gas limits that always
        // successfully.
        //
        // On Arbitrum we can not set a gas limit for every call in the multicall and guarantee that
        // we will not run out of gas on the node. This is because they have a different way of accounting
        // for gas, that seperates storage and compute gas costs, and we can not cover both in a single limit.
        //
        // To work around this and avoid throwing errors when really we just couldn't get a quote, we catch this
        // case and return 0 quotes found.
        if (
          (this.chainId == util_1.ChainId.ARBITRUM_ONE ||
            this.chainId == util_1.ChainId.ARBITRUM_RINKEBY) &&
          lodash_1.default.every(
            failedQuoteStates,
            (failedQuoteState) =>
              failedQuoteState.reason instanceof ProviderGasError
          ) &&
          attemptNumber == this.retryOptions.retries
        ) {
          log_1.log.error(
            `Failed to get quotes on Arbitrum due to provider gas error issue. Overriding error to return 0 quotes.`
          );
          return {
            results: [],
            blockNumber: bignumber_1.BigNumber.from(0),
            approxGasUsedPerSuccessCall: 0,
          };
        }
        throw new Error(
          `Failed to get ${failedQuoteStates.length} quotes. Reasons: ${reasonForFailureStr}`
        );
      }
      const callResults = lodash_1.default.map(
        successfulQuoteStates,
        (quoteState) => quoteState.results
      );
      return {
        results: lodash_1.default.flatMap(
          callResults,
          (result) => result.results
        ),
        blockNumber: bignumber_1.BigNumber.from(callResults[0].blockNumber),
        approxGasUsedPerSuccessCall: stats_lite_1.default.percentile(
          lodash_1.default.map(
            callResults,
            (result) => result.approxGasUsedPerSuccessCall
          ),
          100
        ),
      };
    }, Object.assign({ retries: DEFAULT_BATCH_RETRIES }, this.retryOptions));

    const routesQuotes = this.processQuoteResults(
      quoteResults,
      routes,
      amounts
    );

    // console.log(util.inspect(routesQuotes, { depth: null }));

    util_1.metric.putMetric(
      'QuoteApproxGasUsedPerSuccessfulCall',
      approxGasUsedPerSuccessCall,
      util_1.MetricLoggerUnit.Count
    );
    util_1.metric.putMetric(
      'QuoteNumRetryLoops',
      finalAttemptNumber - 1,
      util_1.MetricLoggerUnit.Count
    );
    util_1.metric.putMetric(
      'QuoteTotalCallsToProvider',
      totalCallsMade,
      util_1.MetricLoggerUnit.Count
    );
    util_1.metric.putMetric(
      'QuoteExpectedCallsToProvider',
      expectedCallsMade,
      util_1.MetricLoggerUnit.Count
    );
    util_1.metric.putMetric(
      'QuoteNumRetriedCalls',
      totalCallsMade - expectedCallsMade,
      util_1.MetricLoggerUnit.Count
    );

    const [successfulQuotes, failedQuotes] = lodash_1
      .default(routesQuotes)
      .flatMap((routeWithQuotes) => routeWithQuotes[1])
      .partition((quote) => quote.quote != null)
      .value();

    log_1.log.info(
      `Got ${successfulQuotes.length} successful quotes, ${
        failedQuotes.length
      } failed quotes. Took ${
        finalAttemptNumber - 1
      } attempt loops. Total calls made to provider: ${totalCallsMade}. Have retried for timeout: ${haveRetriedForTimeout}`
    );
    return { routesWithQuotes: routesQuotes, blockNumber };
  }
  partitionQuotes(quoteStates) {
    const successfulQuoteStates = lodash_1.default.filter(
      quoteStates,
      (quoteState) => quoteState.status == 'success'
    );
    const failedQuoteStates = lodash_1.default.filter(
      quoteStates,
      (quoteState) => quoteState.status == 'failed'
    );
    const pendingQuoteStates = lodash_1.default.filter(
      quoteStates,
      (quoteState) => quoteState.status == 'pending'
    );
    return [successfulQuoteStates, failedQuoteStates, pendingQuoteStates];
  }
  processQuoteResults(quoteResults, routes, amounts) {
    const routesQuotes = [];
    const quotesResultsByRoute = lodash_1.default.chunk(
      quoteResults,
      amounts.length
    );
    const debugFailedQuotes = [];
    for (let i = 0; i < quotesResultsByRoute.length; i++) {
      const route = routes[i];
      const quoteResults = quotesResultsByRoute[i];
      const quotes = lodash_1.default.map(
        quoteResults,
        (quoteResult, index) => {
          const amount = amounts[index];
          if (!quoteResult.success) {
            const percent = (100 / amounts.length) * (index + 1);
            const amountStr = amount.toFixed(
              Math.min(amount.currency.decimals, 2)
            );
            const routeStr = routes_1.routeToString(route);
            debugFailedQuotes.push({
              route: routeStr,
              percent,
              amount: amountStr,
            });
            return {
              amount,
              quote: null,
              sqrtPriceX96AfterList: null,
              gasEstimate: null,
              initializedTicksCrossedList: null,
            };
          }
          return {
            amount,
            quote: quoteResult.result[0],
            sqrtPriceX96AfterList: quoteResult.result[1],
            initializedTicksCrossedList: quoteResult.result[2],
            gasEstimate: quoteResult.result[3],
          };
        }
      );
      routesQuotes.push([route, quotes]);
    }
    // For routes and amounts that we failed to get a quote for, group them by route
    // and batch them together before logging to minimize number of logs.
    const debugChunk = 80;
    lodash_1.default.forEach(
      lodash_1.default.chunk(debugFailedQuotes, debugChunk),
      (quotes, idx) => {
        const failedQuotesByRoute = lodash_1.default.groupBy(
          quotes,
          (q) => q.route
        );
        const failedFlat = lodash_1.default.mapValues(
          failedQuotesByRoute,
          (f) =>
            lodash_1
              .default(f)
              .map((f) => `${f.percent}%[${f.amount}]`)
              .join(',')
        );
        log_1.log.info(
          {
            failedQuotes: lodash_1.default.map(
              failedFlat,
              (amounts, routeStr) => `${routeStr} : ${amounts}`
            ),
          },
          `Failed quotes for V3 routes Part ${idx}/${Math.ceil(
            debugFailedQuotes.length / debugChunk
          )}`
        );
      }
    );
    return routesQuotes;
  }
  validateBlockNumbers(successfulQuoteStates, totalCalls, gasLimitOverride) {
    if (successfulQuoteStates.length <= 1) {
      return null;
    }
    const results = lodash_1.default.map(
      successfulQuoteStates,
      (quoteState) => quoteState.results
    );
    const blockNumbers = lodash_1.default.map(
      results,
      (result) => result.blockNumber
    );
    const uniqBlocks = lodash_1
      .default(blockNumbers)
      .map((blockNumber) => blockNumber.toNumber())
      .uniq()
      .value();
    if (uniqBlocks.length == 1) {
      return null;
    }
    /* if (
          uniqBlocks.length == 2 &&
          Math.abs(uniqBlocks[0]! - uniqBlocks[1]!) <= 1
        ) {
          return null;
        } */
    return new BlockConflictError(
      `Quotes returned from different blocks. ${uniqBlocks}. ${totalCalls} calls were made with gas limit ${gasLimitOverride}`
    );
  }
  validateSuccessRate(allResults, haveRetriedForSuccessRate) {
    const numResults = allResults.length;
    const numSuccessResults = allResults.filter(
      (result) => result.success
    ).length;
    const successRate = (1.0 * numSuccessResults) / numResults;
    const { quoteMinSuccessRate } = this.batchParams;
    if (successRate < quoteMinSuccessRate) {
      if (haveRetriedForSuccessRate) {
        log_1.log.info(
          `Quote success rate still below threshold despite retry. Continuing. ${quoteMinSuccessRate}: ${successRate}`
        );
        return;
      }
      return new SuccessRateError(
        `Quote success rate below threshold of ${quoteMinSuccessRate}: ${successRate}`
      );
    }
  }
}
exports.V3QuoteProvider = V3QuoteProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVvdGUtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvcHJvdmlkZXJzL3YzL3F1b3RlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHdEQUFxRDtBQUVyRCw0Q0FBb0Q7QUFDcEQsOERBQTZEO0FBQzdELG9EQUF1QjtBQUN2Qiw0REFBK0I7QUFFL0Isb0ZBQWlGO0FBQ2pGLHFDQUErRDtBQUMvRCxvREFBeUQ7QUFFekQsd0NBQXFDO0FBQ3JDLDhDQUFrRDtBQThCbEQsTUFBYSxrQkFBbUIsU0FBUSxLQUFLO0lBQTdDOztRQUNTLFNBQUksR0FBRyxvQkFBb0IsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUFGRCxnREFFQztBQUNELE1BQWEsZ0JBQWlCLFNBQVEsS0FBSztJQUEzQzs7UUFDUyxTQUFJLEdBQUcsa0JBQWtCLENBQUM7SUFDbkMsQ0FBQztDQUFBO0FBRkQsNENBRUM7QUFFRCxNQUFhLHdCQUF5QixTQUFRLEtBQUs7SUFBbkQ7O1FBQ1MsU0FBSSxHQUFHLDBCQUEwQixDQUFDO0lBQzNDLENBQUM7Q0FBQTtBQUZELDREQUVDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0lBQS9DOztRQUNTLFNBQUksR0FBRyxzQkFBc0IsQ0FBQztJQUN2QyxDQUFDO0NBQUE7QUFGRCxvREFFQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQWEsZ0JBQWlCLFNBQVEsS0FBSztJQUEzQzs7UUFDUyxTQUFJLEdBQUcsa0JBQWtCLENBQUM7SUFDbkMsQ0FBQztDQUFBO0FBRkQsNENBRUM7QUFzSUQsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7QUFFaEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSCxNQUFhLGVBQWU7SUFFMUI7Ozs7Ozs7Ozs7Ozs7T0FhRztJQUNILFlBQ1ksT0FBZ0IsRUFDaEIsUUFBc0I7SUFDaEMsK0VBQStFO0lBQ3JFLGtCQUE0QyxFQUM1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
