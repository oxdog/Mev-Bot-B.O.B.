'use strict';
const util = require('util');

var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.AlphaRouter = void 0;
const bignumber_1 = require('@ethersproject/bignumber');
const providers_1 = require('@ethersproject/providers');
const default_token_list_1 = __importDefault(
  require('@uniswap/default-token-list')
);
const router_sdk_1 = require('@uniswap/router-sdk');
const sdk_core_1 = require('@uniswap/sdk-core');
const v3_sdk_1 = require('@uniswap/v3-sdk');
const async_retry_1 = __importDefault(require('async-retry'));
const jsbi_1 = __importDefault(require('jsbi'));
const lodash_1 = __importDefault(require('lodash'));
const node_cache_1 = __importDefault(require('node-cache'));
const _1 = require('.');
const providers_2 = require('../../providers');
const caching_token_list_provider_1 = require('../../providers/caching-token-list-provider');
const token_provider_1 = require('../../providers/token-provider');
const token_validator_provider_1 = require('../../providers/token-validator-provider');
const pool_provider_1 = require('../../providers/v2/pool-provider');
const gas_data_provider_1 = require('../../providers/v3/gas-data-provider');
const pool_provider_2 = require('../../providers/v3/pool-provider');
const quote_provider_1 = require('../../providers/v3/quote-provider');
const chains_1 = require('../../util/chains');
const log_1 = require('../../util/log');
const methodParameters_1 = require('../../util/methodParameters');
const metric_1 = require('../../util/metric');
const routes_1 = require('../../util/routes');
const unsupported_tokens_1 = require('../../util/unsupported-tokens');
const router_1 = require('../router');
const config_1 = require('./config');
const route_with_valid_quote_1 = require('./entities/route-with-valid-quote');
const best_swap_route_1 = require('./functions/best-swap-route');
const calculate_ratio_amount_in_1 = require('./functions/calculate-ratio-amount-in');
const compute_all_routes_1 = require('./functions/compute-all-routes');
const get_candidate_pools_1 = require('./functions/get-candidate-pools');
const v2_heuristic_gas_model_1 = require('./gas-models/v2/v2-heuristic-gas-model');
class AlphaRouter {
  constructor({
    chainId,
    provider,
    multicall2Provider,
    v3PoolProvider,
    v3QuoteProvider,
    v2PoolProvider,
    v2QuoteProvider,
    v2SubgraphProvider,
    tokenProvider,
    blockedTokenListProvider,
    v3SubgraphProvider,
    gasPriceProvider,
    v3GasModelFactory,
    v2GasModelFactory,
    swapRouterProvider,
    optimismGasDataProvider,
    tokenValidatorProvider,
    arbitrumGasDataProvider,
  }) {
    this.chainId = chainId;
    this.provider = provider;
    this.multicall2Provider =
      multicall2Provider !== null && multicall2Provider !== void 0
        ? multicall2Provider
        : new providers_2.UniswapMulticallProvider(chainId, provider, 375000);
    this.v3PoolProvider =
      v3PoolProvider !== null && v3PoolProvider !== void 0
        ? v3PoolProvider
        : new providers_2.CachingV3PoolProvider(
            this.chainId,
            new pool_provider_2.V3PoolProvider(
              chains_1.ID_TO_CHAIN_ID(chainId),
              this.multicall2Provider
            ),
            new providers_2.NodeJSCache(
              new node_cache_1.default({ stdTTL: 360, useClones: false })
            )
          );
    if (v3QuoteProvider) {
      this.v3QuoteProvider = v3QuoteProvider;
    } else {
      switch (chainId) {
        case chains_1.ChainId.OPTIMISM:
        case chains_1.ChainId.OPTIMISTIC_KOVAN:
          this.v3QuoteProvider = new quote_provider_1.V3QuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 110,
              gasLimitPerCall: 1200000,
              quoteMinSuccessRate: 0.1,
            },
            {
              gasLimitOverride: 3000000,
              multicallChunk: 45,
            },
            {
              gasLimitOverride: 3000000,
              multicallChunk: 45,
            },
            {
              baseBlockOffset: -10,
              rollback: {
                enabled: true,
                attemptsBeforeRollback: 1,
                rollbackBlockOffset: -10,
              },
            }
          );
          break;
        case chains_1.ChainId.ARBITRUM_ONE:
        case chains_1.ChainId.ARBITRUM_RINKEBY:
          this.v3QuoteProvider = new quote_provider_1.V3QuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 10,
              gasLimitPerCall: 12000000,
              quoteMinSuccessRate: 0.1,
            },
            {
              gasLimitOverride: 30000000,
              multicallChunk: 6,
            },
            {
              gasLimitOverride: 30000000,
              multicallChunk: 6,
            }
          );
          break;
        default:
          this.v3QuoteProvider = new quote_provider_1.V3QuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 210,
              gasLimitPerCall: 705000,
              quoteMinSuccessRate: 0.15,
            },
            {
              gasLimitOverride: 2000000,
              multicallChunk: 70,
            }
          );
          break;
      }
    }
    this.v2PoolProvider =
      v2PoolProvider !== null && v2PoolProvider !== void 0
        ? v2PoolProvider
        : new pool_provider_1.V2PoolProvider(chainId, this.multicall2Provider);
    this.v2QuoteProvider =
      v2QuoteProvider !== null && v2QuoteProvider !== void 0
        ? v2QuoteProvider
        : new providers_2.V2QuoteProvider();
    this.blockedTokenListProvider =
      blockedTokenListProvider !== null && blockedTokenListProvider !== void 0
        ? blockedTokenListProvider
        : new caching_token_list_provider_1.CachingTokenListProvider(
            chainId,
            unsupported_tokens_1.UNSUPPORTED_TOKENS,
            new providers_2.NodeJSCache(
              new node_cache_1.default({ stdTTL: 3600, useClones: false })
            )
          );
    this.tokenProvider =
      tokenProvider !== null && tokenProvider !== void 0
        ? tokenProvider
        : new providers_2.CachingTokenProviderWithFallback(
            chainId,
            new providers_2.NodeJSCache(
              new node_cache_1.default({ stdTTL: 3600, useClones: false })
            ),
            new caching_token_list_provider_1.CachingTokenListProvider(
              chainId,
              default_token_list_1.default,
              new providers_2.NodeJSCache(
                new node_cache_1.default({ stdTTL: 3600, useClones: false })
              )
            ),
            new token_provider_1.TokenProvider(chainId, this.multicall2Provider)
          );
    const chainName = chains_1.ID_TO_NETWORK_NAME(chainId);
    // ipfs urls in the following format: `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/${protocol}/${chainName}.json`;
    if (v2SubgraphProvider) {
      this.v2SubgraphProvider = v2SubgraphProvider;
    } else {
      this.v2SubgraphProvider = new providers_2.V2SubgraphProviderWithFallBacks(
        [
          new providers_2.CachingV2SubgraphProvider(
            chainId,
            new providers_2.URISubgraphProvider(
              chainId,
              `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/v2/${chainName}.json`,
              undefined,
              0
            ),
            new providers_2.NodeJSCache(
              new node_cache_1.default({ stdTTL: 300, useClones: false })
            )
          ),
          new providers_2.StaticV2SubgraphProvider(chainId),
        ]
      );
    }
    if (v3SubgraphProvider) {
      this.v3SubgraphProvider = v3SubgraphProvider;
    } else {
      this.v3SubgraphProvider = new providers_2.V3SubgraphProviderWithFallBacks(
        [
          new providers_2.CachingV3SubgraphProvider(
            chainId,
            new providers_2.URISubgraphProvider(
              chainId,
              `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/v3/${chainName}.json`,
              undefined,
              0
            ),
            new providers_2.NodeJSCache(
              new node_cache_1.default({ stdTTL: 300, useClones: false })
            )
          ),
          new providers_2.StaticV3SubgraphProvider(
            chainId,
            this.v3PoolProvider
          ),
        ]
      );
    }
    this.gasPriceProvider =
      gasPriceProvider !== null && gasPriceProvider !== void 0
        ? gasPriceProvider
        : new providers_2.CachingGasStationProvider(
            chainId,
            this.provider instanceof providers_1.JsonRpcProvider
              ? new providers_2.OnChainGasPriceProvider(
                  chainId,
                  new providers_2.EIP1559GasPriceProvider(this.provider),
                  new providers_2.LegacyGasPriceProvider(this.provider)
                )
              : new providers_2.ETHGasStationInfoProvider(
                  config_1.ETH_GAS_STATION_API_URL
                ),
            new providers_2.NodeJSCache(
              new node_cache_1.default({ stdTTL: 15, useClones: false })
            )
          );
    this.v3GasModelFactory =
      v3GasModelFactory !== null && v3GasModelFactory !== void 0
        ? v3GasModelFactory
        : new _1.V3HeuristicGasModelFactory();
    this.v2GasModelFactory =
      v2GasModelFactory !== null && v2GasModelFactory !== void 0
        ? v2GasModelFactory
        : new v2_heuristic_gas_model_1.V2HeuristicGasModelFactory();
    this.swapRouterProvider =
      swapRouterProvider !== null && swapRouterProvider !== void 0
        ? swapRouterProvider
        : new providers_2.SwapRouterProvider(this.multicall2Provider);
    if (
      chainId == chains_1.ChainId.OPTIMISM ||
      chainId == chains_1.ChainId.OPTIMISTIC_KOVAN
    ) {
      this.l2GasDataProvider =
        optimismGasDataProvider !== null && optimismGasDataProvider !== void 0
          ? optimismGasDataProvider
          : new gas_data_provider_1.OptimismGasDataProvider(
              chainId,
              this.multicall2Provider
            );
    }
    if (
      chainId == chains_1.ChainId.ARBITRUM_ONE ||
      chainId == chains_1.ChainId.ARBITRUM_RINKEBY
    ) {
      this.l2GasDataProvider =
        arbitrumGasDataProvider !== null && arbitrumGasDataProvider !== void 0
          ? arbitrumGasDataProvider
          : new gas_data_provider_1.ArbitrumGasDataProvider(
              chainId,
              this.provider
            );
    }
    if (tokenValidatorProvider) {
      this.tokenValidatorProvider = tokenValidatorProvider;
    } else if (this.chainId == chains_1.ChainId.MAINNET) {
      this.tokenValidatorProvider =
        new token_validator_provider_1.TokenValidatorProvider(
          this.chainId,
          this.multicall2Provider,
          new providers_2.NodeJSCache(
            new node_cache_1.default({ stdTTL: 30000, useClones: false })
          )
        );
    }
  }
  async routeToRatio(
    token0Balance,
    token1Balance,
    position,
    swapAndAddConfig,
    swapAndAddOptions,
    routingConfig = config_1.DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId)
  ) {
    if (
      token1Balance.currency.wrapped.sortsBefore(token0Balance.currency.wrapped)
    ) {
      [token0Balance, token1Balance] = [token1Balance, token0Balance];
    }
    let preSwapOptimalRatio = this.calculateOptimalRatio(
      position,
      position.pool.sqrtRatioX96,
      true
    );
    // set up parameters according to which token will be swapped
    let zeroForOne;
    if (position.pool.tickCurrent > position.tickUpper) {
      zeroForOne = true;
    } else if (position.pool.tickCurrent < position.tickLower) {
      zeroForOne = false;
    } else {
      zeroForOne = new sdk_core_1.Fraction(
        token0Balance.quotient,
        token1Balance.quotient
      ).greaterThan(preSwapOptimalRatio);
      if (!zeroForOne) preSwapOptimalRatio = preSwapOptimalRatio.invert();
    }
    const [inputBalance, outputBalance] = zeroForOne
      ? [token0Balance, token1Balance]
      : [token1Balance, token0Balance];
    let optimalRatio = preSwapOptimalRatio;
    let postSwapTargetPool = position.pool;
    let exchangeRate = zeroForOne
      ? position.pool.token0Price
      : position.pool.token1Price;
    let swap = null;
    let ratioAchieved = false;
    let n = 0;
    // iterate until we find a swap with a sufficient ratio or return null
    while (!ratioAchieved) {
      n++;
      if (n > swapAndAddConfig.maxIterations) {
        log_1.log.info('max iterations exceeded');
        return {
          status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
          error: 'max iterations exceeded',
        };
      }
      const amountToSwap = calculate_ratio_amount_in_1.calculateRatioAmountIn(
        optimalRatio,
        exchangeRate,
        inputBalance,
        outputBalance
      );
      if (amountToSwap.equalTo(0)) {
        log_1.log.info(`no swap needed: amountToSwap = 0`);
        return {
          status: router_1.SwapToRatioStatus.NO_SWAP_NEEDED,
        };
      }
      swap = await this.route(
        amountToSwap,
        outputBalance.currency,
        sdk_core_1.TradeType.EXACT_INPUT,
        undefined,
        Object.assign(
          Object.assign(
            Object.assign(
              {},
              config_1.DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId)
            ),
            routingConfig
          ),
          { protocols: [router_sdk_1.Protocol.V3, router_sdk_1.Protocol.V2] }
        )
      );
      if (!swap) {
        log_1.log.info('no route found from this.route()');
        return {
          status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
          error: 'no route found',
        };
      }
      const inputBalanceUpdated = inputBalance.subtract(swap.trade.inputAmount);
      const outputBalanceUpdated = outputBalance.add(swap.trade.outputAmount);
      const newRatio = inputBalanceUpdated.divide(outputBalanceUpdated);
      let targetPoolPriceUpdate;
      swap.route.forEach((route) => {
        if (route.protocol == router_sdk_1.Protocol.V3) {
          const v3Route = route;
          v3Route.route.pools.forEach((pool, i) => {
            if (
              pool.token0.equals(position.pool.token0) &&
              pool.token1.equals(position.pool.token1) &&
              pool.fee == position.pool.fee
            ) {
              targetPoolPriceUpdate = jsbi_1.default.BigInt(
                v3Route.sqrtPriceX96AfterList[i].toString()
              );
              optimalRatio = this.calculateOptimalRatio(
                position,
                jsbi_1.default.BigInt(targetPoolPriceUpdate.toString()),
                zeroForOne
              );
            }
          });
        }
      });
      if (!targetPoolPriceUpdate) {
        optimalRatio = preSwapOptimalRatio;
      }
      ratioAchieved =
        newRatio.equalTo(optimalRatio) ||
        this.absoluteValue(
          newRatio.asFraction.divide(optimalRatio).subtract(1)
        ).lessThan(swapAndAddConfig.ratioErrorTolerance);
      if (ratioAchieved && targetPoolPriceUpdate) {
        postSwapTargetPool = new v3_sdk_1.Pool(
          position.pool.token0,
          position.pool.token1,
          position.pool.fee,
          targetPoolPriceUpdate,
          position.pool.liquidity,
          v3_sdk_1.TickMath.getTickAtSqrtRatio(targetPoolPriceUpdate),
          position.pool.tickDataProvider
        );
      }
      exchangeRate = swap.trade.outputAmount.divide(swap.trade.inputAmount);
      log_1.log.info(
        {
          exchangeRate: exchangeRate.asFraction.toFixed(18),
          optimalRatio: optimalRatio.asFraction.toFixed(18),
          newRatio: newRatio.asFraction.toFixed(18),
          inputBalanceUpdated: inputBalanceUpdated.asFraction.toFixed(18),
          outputBalanceUpdated: outputBalanceUpdated.asFraction.toFixed(18),
          ratioErrorTolerance: swapAndAddConfig.ratioErrorTolerance.toFixed(18),
          iterationN: n.toString(),
        },
        'QuoteToRatio Iteration Parameters'
      );
      if (exchangeRate.equalTo(0)) {
        log_1.log.info('exchangeRate to 0');
        return {
          status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
          error: 'insufficient liquidity to swap to optimal ratio',
        };
      }
    }
    if (!swap) {
      return {
        status: router_1.SwapToRatioStatus.NO_ROUTE_FOUND,
        error: 'no route found',
      };
    }
    let methodParameters;
    if (swapAndAddOptions) {
      methodParameters = await this.buildSwapAndAddMethodParameters(
        swap.trade,
        swapAndAddOptions,
        {
          initialBalanceTokenIn: inputBalance,
          initialBalanceTokenOut: outputBalance,
          preLiquidityPosition: position,
        }
      );
    }
    return {
      status: router_1.SwapToRatioStatus.SUCCESS,
      result: Object.assign(Object.assign({}, swap), {
        methodParameters,
        optimalRatio,
        postSwapTargetPool,
      }),
    };
  }
  /**
   * @inheritdoc IRouter
   */
  async route(
    amount,
    quoteCurrency,
    tradeType,
    swapConfig,
    partialRoutingConfig = {}
  ) {
    var _a;
    metric_1.metric.putMetric(
      `QuoteRequestedForChain${this.chainId}`,
      1,
      metric_1.MetricLoggerUnit.Count
    );
    // Get a block number to specify in all our calls. Ensures data we fetch from chain is
    // from the same block.
    const blockNumber =
      (_a = partialRoutingConfig.blockNumber) !== null && _a !== void 0
        ? _a
        : this.getBlockNumberPromise();
    const routingConfig = lodash_1.default.merge(
      {},
      config_1.DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId),
      partialRoutingConfig,
      { blockNumber }
    );
    const { protocols } = routingConfig;
    const currencyIn =
      tradeType == sdk_core_1.TradeType.EXACT_INPUT
        ? amount.currency
        : quoteCurrency;
    const currencyOut =
      tradeType == sdk_core_1.TradeType.EXACT_INPUT
        ? quoteCurrency
        : amount.currency;
    const tokenIn = currencyIn.wrapped;
    const tokenOut = currencyOut.wrapped;
    // Generate our distribution of amounts, i.e. fractions of the input amount.
    // We will get quotes for fractions of the input amount for different routes, then
    // combine to generate split routes.
    let [percents, amounts] = this.getAmountDistribution(amount, routingConfig);

    // ! #################################
    // Reduces amounts for faster calc
    amounts = amounts.filter((_, index) => index % 2 == 0);

    // Get an estimate of the gas price to use when estimating gas cost of different routes.
    const beforeGas = Date.now();
    const { gasPriceWei } = await this.gasPriceProvider.getGasPrice();
    metric_1.metric.putMetric(
      'GasPriceLoad',
      Date.now() - beforeGas,
      metric_1.MetricLoggerUnit.Milliseconds
    );
    const quoteToken = quoteCurrency.wrapped;
    const quotePromises = [];
    const protocolsSet = new Set(
      protocols !== null && protocols !== void 0 ? protocols : []
    );
    const gasModel = await this.v3GasModelFactory.buildGasModel(
      this.chainId,
      gasPriceWei,
      this.v3PoolProvider,
      quoteToken,
      this.l2GasDataProvider
    );
    if (
      (protocolsSet.size == 0 ||
        (protocolsSet.has(router_sdk_1.Protocol.V2) &&
          protocolsSet.has(router_sdk_1.Protocol.V3))) &&
      chains_1.V2_SUPPORTED.includes(this.chainId)
    ) {
      log_1.log.info({ protocols, tradeType }, 'Routing across all protocols');
      quotePromises.push(
        this.getV3Quotes(
          tokenIn,
          tokenOut,
          amounts,
          percents,
          quoteToken,
          gasModel,
          tradeType,
          routingConfig
        )
      );
      quotePromises.push(
        this.getV2Quotes(
          tokenIn,
          tokenOut,
          amounts,
          percents,
          quoteToken,
          gasPriceWei,
          tradeType,
          routingConfig
        )
      );
    } else {
      if (
        protocolsSet.has(router_sdk_1.Protocol.V3) ||
        (protocolsSet.size == 0 &&
          !chains_1.V2_SUPPORTED.includes(this.chainId))
      ) {
        log_1.log.info({ protocols, swapType: tradeType }, 'Routing across V3');
        quotePromises.push(
          this.getV3Quotes(
            tokenIn,
            tokenOut,
            amounts,
            percents,
            quoteToken,
            gasModel,
            tradeType,
            routingConfig
          )
        );
      }
      if (protocolsSet.has(router_sdk_1.Protocol.V2)) {
        log_1.log.info({ protocols, swapType: tradeType }, 'Routing across V2');
        quotePromises.push(
          this.getV2Quotes(
            tokenIn,
            tokenOut,
            amounts,
            percents,
            quoteToken,
            gasPriceWei,
            tradeType,
            routingConfig
          )
        );
      }
    }
    const routesWithValidQuotesByProtocol = await Promise.all(quotePromises);
    let allRoutesWithValidQuotes = [];
    let allCandidatePools = [];
    for (const {
      routesWithValidQuotes,
      candidatePools,
    } of routesWithValidQuotesByProtocol) {
      allRoutesWithValidQuotes = [
        ...allRoutesWithValidQuotes,
        ...routesWithValidQuotes,
      ];
      allCandidatePools = [...allCandidatePools, candidatePools];
    }
    if (allRoutesWithValidQuotes.length == 0) {
      log_1.log.info({ allRoutesWithValidQuotes }, 'Received no valid quotes');
      return null;
    }
    // Given all the quotes for all the amounts for all the routes, find the best combination.
    const beforeBestSwap = Date.now();
    const swapRouteRaw = await best_swap_route_1.getBestSwapRoute(
      amount,
      percents,
      allRoutesWithValidQuotes,
      tradeType,
      this.chainId,
      routingConfig,
      gasModel
    );
    if (!swapRouteRaw) {
      return null;
    }
    const {
      quote,
      quoteGasAdjusted,
      estimatedGasUsed,
      routes: routeAmounts,
      estimatedGasUsedQuoteToken,
      estimatedGasUsedUSD,
    } = swapRouteRaw;
    // Build Trade object that represents the optimal swap.
    const trade = methodParameters_1.buildTrade(
      currencyIn,
      currencyOut,
      tradeType,
      routeAmounts
    );
    let methodParameters;
    // If user provided recipient, deadline etc. we also generate the calldata required to execute
    // the swap and return it too.
    if (swapConfig) {
      methodParameters = methodParameters_1.buildSwapMethodParameters(
        trade,
        swapConfig
      );
    }
    metric_1.metric.putMetric(
      'FindBestSwapRoute',
      Date.now() - beforeBestSwap,
      metric_1.MetricLoggerUnit.Milliseconds
    );
    metric_1.metric.putMetric(
      `QuoteFoundForChain${this.chainId}`,
      1,
      metric_1.MetricLoggerUnit.Count
    );
    this.emitPoolSelectionMetrics(swapRouteRaw, allCandidatePools);
    return {
      quote,
      quoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedQuoteToken,
      estimatedGasUsedUSD,
      gasPriceWei,
      route: routeAmounts,
      trade,
      methodParameters,
      blockNumber: bignumber_1.BigNumber.from(await blockNumber),
    };
  }
  async applyTokenValidatorToPools(pools, isInvalidFn) {
    if (!this.tokenValidatorProvider) {
      return pools;
    }
    log_1.log.info(`Running token validator on ${pools.length} pools`);
    const tokens = lodash_1.default.flatMap(pools, (pool) => [
      pool.token0,
      pool.token1,
    ]);
    const tokenValidationResults =
      await this.tokenValidatorProvider.validateTokens(tokens);
    const poolsFiltered = lodash_1.default.filter(pools, (pool) => {
      const token0Validation = tokenValidationResults.getValidationByToken(
        pool.token0
      );
      const token1Validation = tokenValidationResults.getValidationByToken(
        pool.token1
      );
      const token0Invalid = isInvalidFn(pool.token0, token0Validation);
      const token1Invalid = isInvalidFn(pool.token1, token1Validation);
      if (token0Invalid || token1Invalid) {
        log_1.log.info(
          `Dropping pool ${routes_1.poolToString(
            pool
          )} because token is invalid. ${
            pool.token0.symbol
          }: ${token0Validation}, ${pool.token1.symbol}: ${token1Validation}`
        );
      }
      return !token0Invalid && !token1Invalid;
    });
    return poolsFiltered;
  }
  async getV3Quotes(
    tokenIn,
    tokenOut,
    amounts,
    percents,
    quoteToken,
    gasModel,
    swapType,
    routingConfig
  ) {
    log_1.log.info('Starting to get V3 quotes');
    // Fetch all the pools that we will consider routing via. There are thousands
    // of pools, so we filter them to a set of candidate pools that we expect will
    // result in good prices.

    const { poolAccessor, candidatePools } =
      await get_candidate_pools_1.getV3CandidatePools({
        tokenIn,
        tokenOut,
        tokenProvider: this.tokenProvider,
        blockedTokenListProvider: this.blockedTokenListProvider,
        poolProvider: this.v3PoolProvider,
        routeType: swapType,
        subgraphProvider: this.v3SubgraphProvider,
        routingConfig,
        chainId: this.chainId,
      });
    const poolsRaw = poolAccessor.getAllPools();
    // Drop any pools that contain fee on transfer tokens (not supported by v3) or have issues with being transferred.
    const pools = await this.applyTokenValidatorToPools(
      poolsRaw,
      (token, tokenValidation) => {
        // If there is no available validation result we assume the token is fine.
        if (!tokenValidation) {
          return false;
        }
        // Only filters out *intermediate* pools that involve tokens that we detect
        // cant be transferred. This prevents us trying to route through tokens that may
        // not be transferrable, but allows users to still swap those tokens if they
        // specify.
        //
        if (
          tokenValidation ==
            token_validator_provider_1.TokenValidationResult.STF &&
          (token.equals(tokenIn) || token.equals(tokenOut))
        ) {
          return false;
        }
        return (
          tokenValidation ==
            token_validator_provider_1.TokenValidationResult.FOT ||
          tokenValidation ==
            token_validator_provider_1.TokenValidationResult.STF
        );
      }
    );
    // Given all our candidate pools, compute all the possible ways to route from tokenIn to tokenOut.
    const { maxSwapsPerPath } = routingConfig;
    const routes = compute_all_routes_1.computeAllV3Routes(
      tokenIn,
      tokenOut,
      pools,
      maxSwapsPerPath
    );
    if (routes.length == 0) {
      return { routesWithValidQuotes: [], candidatePools };
    }
    // For all our routes, and all the fractional amounts, fetch quotes on-chain.
    const quoteFn =
      swapType == sdk_core_1.TradeType.EXACT_INPUT
        ? this.v3QuoteProvider.getQuotesManyExactIn.bind(this.v3QuoteProvider)
        : this.v3QuoteProvider.getQuotesManyExactOut.bind(this.v3QuoteProvider);
    const beforeQuotes = Date.now();
    log_1.log.info(
      `Getting quotes for V3 for ${routes.length} routes with ${amounts.length} amounts per route.`
    );

    // ! ########################
    // ! ########################
    // ! ########################
    // ! ########################
    // ! ########################
    // ! ########################
    // ! ########################
    // ! ########################

    console.log(
      `Getting quotes for V3 for ${routes.length} routes with ${amounts.length} amounts per route.`
    );
    const { routesWithQuotes } = await quoteFn(amounts, routes, {
      blockNumber: routingConfig.blockNumber,
    });

    // console.log("routesWithQuotes", util.inspect(routesWithQuotes[0],{showHidden:true,depth:null}))

    metric_1.metric.putMetric(
      'V3QuotesLoad',
      Date.now() - beforeQuotes,
      metric_1.MetricLoggerUnit.Milliseconds
    );
    metric_1.metric.putMetric(
      'V3QuotesFetched',
      lodash_1
        .default(routesWithQuotes)
        .map(([, quotes]) => quotes.length)
        .sum(),
      metric_1.MetricLoggerUnit.Count
    );
    const routesWithValidQuotes = [];
    for (const routeWithQuote of routesWithQuotes) {
      const [route, quotes] = routeWithQuote;
      for (let i = 0; i < quotes.length; i++) {
        const percent = percents[i];
        const amountQuote = quotes[i];
        const {
          quote,
          amount,
          sqrtPriceX96AfterList,
          initializedTicksCrossedList,
          gasEstimate,
        } = amountQuote;
        if (
          !quote ||
          !sqrtPriceX96AfterList ||
          !initializedTicksCrossedList ||
          !gasEstimate
        ) {
          log_1.log.debug(
            {
              route: routes_1.routeToString(route),
              amountQuote,
            },
            'Dropping a null V3 quote for route.'
          );
          continue;
        }
        const routeWithValidQuote =
          new route_with_valid_quote_1.V3RouteWithValidQuote({
            route,
            rawQuote: quote,
            amount,
            percent,
            sqrtPriceX96AfterList,
            initializedTicksCrossedList,
            quoterGasEstimate: gasEstimate,
            gasModel,
            quoteToken,
            tradeType: swapType,
            v3PoolProvider: this.v3PoolProvider,
          });
        routesWithValidQuotes.push(routeWithValidQuote);
      }
    }
    return { routesWithValidQuotes, candidatePools };
  }
  async getV2Quotes(
    tokenIn,
    tokenOut,
    amounts,
    percents,
    quoteToken,
    gasPriceWei,
    swapType,
    routingConfig
  ) {
    log_1.log.info('Starting to get V2 quotes');
    // Fetch all the pools that we will consider routing via. There are thousands
    // of pools, so we filter them to a set of candidate pools that we expect will
    // result in good prices.
    const { poolAccessor, candidatePools } =
      await get_candidate_pools_1.getV2CandidatePools({
        tokenIn,
        tokenOut,
        tokenProvider: this.tokenProvider,
        blockedTokenListProvider: this.blockedTokenListProvider,
        poolProvider: this.v2PoolProvider,
        routeType: swapType,
        subgraphProvider: this.v2SubgraphProvider,
        routingConfig,
        chainId: this.chainId,
      });
    const poolsRaw = poolAccessor.getAllPools();
    // Drop any pools that contain tokens that can not be transferred according to the token validator.
    const pools = await this.applyTokenValidatorToPools(
      poolsRaw,
      (token, tokenValidation) => {
        // If there is no available validation result we assume the token is fine.
        if (!tokenValidation) {
          return false;
        }
        // Only filters out *intermediate* pools that involve tokens that we detect
        // cant be transferred. This prevents us trying to route through tokens that may
        // not be transferrable, but allows users to still swap those tokens if they
        // specify.
        if (
          tokenValidation ==
            token_validator_provider_1.TokenValidationResult.STF &&
          (token.equals(tokenIn) || token.equals(tokenOut))
        ) {
          return false;
        }
        return (
          tokenValidation ==
          token_validator_provider_1.TokenValidationResult.STF
        );
      }
    );
    // Given all our candidate pools, compute all the possible ways to route from tokenIn to tokenOut.
    const { maxSwapsPerPath } = routingConfig;
    const routes = compute_all_routes_1.computeAllV2Routes(
      tokenIn,
      tokenOut,
      pools,
      maxSwapsPerPath
    );
    if (routes.length == 0) {
      return { routesWithValidQuotes: [], candidatePools };
    }
    // For all our routes, and all the fractional amounts, fetch quotes on-chain.
    const quoteFn =
      swapType == sdk_core_1.TradeType.EXACT_INPUT
        ? this.v2QuoteProvider.getQuotesManyExactIn.bind(this.v2QuoteProvider)
        : this.v2QuoteProvider.getQuotesManyExactOut.bind(this.v2QuoteProvider);
    const beforeQuotes = Date.now();
    log_1.log.info(
      `Getting quotes for V2 for ${routes.length} routes with ${amounts.length} amounts per route.`
    );
    const { routesWithQuotes } = await quoteFn(amounts, routes);
    const gasModel = await this.v2GasModelFactory.buildGasModel(
      this.chainId,
      gasPriceWei,
      this.v2PoolProvider,
      quoteToken
    );
    metric_1.metric.putMetric(
      'V2QuotesLoad',
      Date.now() - beforeQuotes,
      metric_1.MetricLoggerUnit.Milliseconds
    );
    metric_1.metric.putMetric(
      'V2QuotesFetched',
      lodash_1
        .default(routesWithQuotes)
        .map(([, quotes]) => quotes.length)
        .sum(),
      metric_1.MetricLoggerUnit.Count
    );
    const routesWithValidQuotes = [];
    for (const routeWithQuote of routesWithQuotes) {
      const [route, quotes] = routeWithQuote;
      for (let i = 0; i < quotes.length; i++) {
        const percent = percents[i];
        const amountQuote = quotes[i];
        const { quote, amount } = amountQuote;
        if (!quote) {
          log_1.log.debug(
            {
              route: routes_1.routeToString(route),
              amountQuote,
            },
            'Dropping a null V2 quote for route.'
          );
          continue;
        }
        const routeWithValidQuote =
          new route_with_valid_quote_1.V2RouteWithValidQuote({
            route,
            rawQuote: quote,
            amount,
            percent,
            gasModel,
            quoteToken,
            tradeType: swapType,
            v2PoolProvider: this.v2PoolProvider,
          });
        routesWithValidQuotes.push(routeWithValidQuote);
      }
    }
    return { routesWithValidQuotes, candidatePools };
  }
  // Note multiplications here can result in a loss of precision in the amounts (e.g. taking 50% of 101)
  // This is reconcilled at the end of the algorithm by adding any lost precision to one of
  // the splits in the route.
  getAmountDistribution(amount, routingConfig) {
    const { distributionPercent } = routingConfig;
    const percents = [];
    const amounts = [];
    for (let i = 1; i <= 100 / distributionPercent; i++) {
      percents.push(i * distributionPercent);
      amounts.push(
        amount.multiply(new sdk_core_1.Fraction(i * distributionPercent, 100))
      );
    }
    return [percents, amounts];
  }
  async buildSwapAndAddMethodParameters(
    trade,
    swapAndAddOptions,
    swapAndAddParameters
  ) {
    const {
      swapOptions: { recipient, slippageTolerance, deadline, inputTokenPermit },
      addLiquidityOptions: addLiquidityConfig,
    } = swapAndAddOptions;
    const preLiquidityPosition = swapAndAddParameters.preLiquidityPosition;
    const finalBalanceTokenIn =
      swapAndAddParameters.initialBalanceTokenIn.subtract(trade.inputAmount);
    const finalBalanceTokenOut =
      swapAndAddParameters.initialBalanceTokenOut.add(trade.outputAmount);
    const approvalTypes = await this.swapRouterProvider.getApprovalType(
      finalBalanceTokenIn,
      finalBalanceTokenOut
    );
    const zeroForOne = finalBalanceTokenIn.currency.wrapped.sortsBefore(
      finalBalanceTokenOut.currency.wrapped
    );
    return router_sdk_1.SwapRouter.swapAndAddCallParameters(
      trade,
      {
        recipient,
        slippageTolerance,
        deadlineOrPreviousBlockhash: deadline,
        inputTokenPermit,
      },
      v3_sdk_1.Position.fromAmounts({
        pool: preLiquidityPosition.pool,
        tickLower: preLiquidityPosition.tickLower,
        tickUpper: preLiquidityPosition.tickUpper,
        amount0: zeroForOne
          ? finalBalanceTokenIn.quotient.toString()
          : finalBalanceTokenOut.quotient.toString(),
        amount1: zeroForOne
          ? finalBalanceTokenOut.quotient.toString()
          : finalBalanceTokenIn.quotient.toString(),
        useFullPrecision: false,
      }),
      addLiquidityConfig,
      approvalTypes.approvalTokenIn,
      approvalTypes.approvalTokenOut
    );
  }
  emitPoolSelectionMetrics(swapRouteRaw, allPoolsBySelection) {
    const poolAddressesUsed = new Set();
    const { routes: routeAmounts } = swapRouteRaw;
    lodash_1
      .default(routeAmounts)
      .flatMap((routeAmount) => {
        const { poolAddresses } = routeAmount;
        return poolAddresses;
      })
      .forEach((address) => {
        poolAddressesUsed.add(address.toLowerCase());
      });
    for (const poolsBySelection of allPoolsBySelection) {
      const { protocol } = poolsBySelection;
      lodash_1.default.forIn(
        poolsBySelection.selections,
        (pools, topNSelection) => {
          const topNUsed =
            lodash_1.default.findLastIndex(pools, (pool) =>
              poolAddressesUsed.has(pool.id.toLowerCase())
            ) + 1;
          metric_1.metric.putMetric(
            lodash_1.default.capitalize(`${protocol}${topNSelection}`),
            topNUsed,
            metric_1.MetricLoggerUnit.Count
          );
        }
      );
    }
    let hasV3Route = false;
    let hasV2Route = false;
    for (const routeAmount of routeAmounts) {
      if (routeAmount.protocol == router_sdk_1.Protocol.V3) {
        hasV3Route = true;
      }
      if (routeAmount.protocol == router_sdk_1.Protocol.V2) {
        hasV2Route = true;
      }
    }
    if (hasV3Route && hasV2Route) {
      metric_1.metric.putMetric(
        `V3AndV2SplitRoute`,
        1,
        metric_1.MetricLoggerUnit.Count
      );
      metric_1.metric.putMetric(
        `V3AndV2SplitRouteForChain${this.chainId}`,
        1,
        metric_1.MetricLoggerUnit.Count
      );
    } else if (hasV3Route) {
      if (routeAmounts.length > 1) {
        metric_1.metric.putMetric(
          `V3SplitRoute`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
        metric_1.metric.putMetric(
          `V3SplitRouteForChain${this.chainId}`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
      } else {
        metric_1.metric.putMetric(
          `V3Route`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
        metric_1.metric.putMetric(
          `V3RouteForChain${this.chainId}`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
      }
    } else if (hasV2Route) {
      if (routeAmounts.length > 1) {
        metric_1.metric.putMetric(
          `V2SplitRoute`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
        metric_1.metric.putMetric(
          `V2SplitRouteForChain${this.chainId}`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
      } else {
        metric_1.metric.putMetric(
          `V2Route`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
        metric_1.metric.putMetric(
          `V2RouteForChain${this.chainId}`,
          1,
          metric_1.MetricLoggerUnit.Count
        );
      }
    }
  }
  calculateOptimalRatio(position, sqrtRatioX96, zeroForOne) {
    const upperSqrtRatioX96 = v3_sdk_1.TickMath.getSqrtRatioAtTick(
      position.tickUpper
    );
    const lowerSqrtRatioX96 = v3_sdk_1.TickMath.getSqrtRatioAtTick(
      position.tickLower
    );
    // returns Fraction(0, 1) for any out of range position regardless of zeroForOne. Implication: function
    // cannot be used to determine the trading direction of out of range positions.
    if (
      jsbi_1.default.greaterThan(sqrtRatioX96, upperSqrtRatioX96) ||
      jsbi_1.default.lessThan(sqrtRatioX96, lowerSqrtRatioX96)
    ) {
      return new sdk_core_1.Fraction(0, 1);
    }
    const precision = jsbi_1.default.BigInt('1' + '0'.repeat(18));
    let optimalRatio = new sdk_core_1.Fraction(
      v3_sdk_1.SqrtPriceMath.getAmount0Delta(
        sqrtRatioX96,
        upperSqrtRatioX96,
        precision,
        true
      ),
      v3_sdk_1.SqrtPriceMath.getAmount1Delta(
        sqrtRatioX96,
        lowerSqrtRatioX96,
        precision,
        true
      )
    );
    if (!zeroForOne) optimalRatio = optimalRatio.invert();
    return optimalRatio;
  }
  absoluteValue(fraction) {
    const numeratorAbs = jsbi_1.default.lessThan(
      fraction.numerator,
      jsbi_1.default.BigInt(0)
    )
      ? jsbi_1.default.unaryMinus(fraction.numerator)
      : fraction.numerator;
    const denominatorAbs = jsbi_1.default.lessThan(
      fraction.denominator,
      jsbi_1.default.BigInt(0)
    )
      ? jsbi_1.default.unaryMinus(fraction.denominator)
      : fraction.denominator;
    return new sdk_core_1.Fraction(numeratorAbs, denominatorAbs);
  }
  getBlockNumberPromise() {
    return async_retry_1.default(
      async (_b, attempt) => {
        if (attempt > 1) {
          log_1.log.info(`Get block number attempt ${attempt}`);
        }
        return this.provider.getBlockNumber();
      },
      {
        retries: 2,
        minTimeout: 100,
        maxTimeout: 1000,
      }
    );
  }
}
exports.AlphaRouter = AlphaRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxwaGEtcm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3JvdXRlcnMvYWxwaGEtcm91dGVyL2FscGhhLXJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx3REFBcUQ7QUFDckQsd0RBQXlFO0FBQ3pFLHFGQUE2RDtBQUM3RCxvREFBa0U7QUFDbEUsZ0RBQXlFO0FBR3pFLDRDQU15QjtBQUN6Qiw4REFBZ0M7QUFDaEMsZ0RBQXdCO0FBQ3hCLG9EQUF1QjtBQUN2Qiw0REFBbUM7QUFDbkMsd0JBQStDO0FBQy9DLCtDQXNCeUI7QUFDekIsNkZBR3FEO0FBS3JELG1FQUErRTtBQUMvRSx1RkFJa0Q7QUFDbEQsb0VBRzBDO0FBQzFDLDRFQU04QztBQUM5QyxvRUFHMEM7QUFDMUMsc0VBRzJDO0FBRzNDLDhDQUsyQjtBQUMzQix3Q0FBcUM7QUFDckMsa0VBR3FDO0FBQ3JDLDhDQUE2RDtBQUM3RCw4Q0FBZ0U7QUFDaEUsc0VBQW1FO0FBQ25FLHNDQVVtQjtBQUNuQixxQ0FHa0I7QUFDbEIsOEVBSTJDO0FBQzNDLGlFQUErRDtBQUMvRCxxRkFBK0U7QUFDL0UsdUVBR3dDO0FBQ3hDLHlFQUt5QztBQU16QyxtRkFBb0Y7QUF1THBGLE1BQWEsV0FBVztJQXlCdEIsWUFBWSxFQUNWLE9BQU8sRUFDUCxRQUFRLEVBQ1Isa0JBQWtCLEVBQ2xCLGNBQWMsRUFDZCxlQUFlLEVBQ2YsY0FBYyxFQUNkLGVBQWUsRUFDZixrQkFBa0IsRUFDbEIsYUFBYSxFQUNiLHdCQUF3QixFQUN4QixrQkFBa0IsRUFDbEIsZ0JBQWdCLEVBQ2hCLGlCQUFpQixFQUNqQixpQkFBaUIsRUFDakIsa0JBQWtCLEVBQ2xCLHVCQUF1QixFQUN2QixzQkFBc0IsRUFDdEIsdUJBQXVCLEdBQ0w7UUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7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
