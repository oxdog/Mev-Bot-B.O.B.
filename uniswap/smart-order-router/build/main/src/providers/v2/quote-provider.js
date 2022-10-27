'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.V2QuoteProvider = void 0;
const bignumber_1 = require('@ethersproject/bignumber');
const sdk_core_1 = require('@uniswap/sdk-core');
const v2_sdk_1 = require('@uniswap/v2-sdk');
const log_1 = require('../../util/log');
const routes_1 = require('../../util/routes');
const util = require('util');
const { JSBI } = require('@uniswap/sdk');
const { utils } = require('ethers');

/**
 * Computes quotes for V2 off-chain. Quotes are computed using the balances
 * of the pools within each route provided.
 *
 * @export
 * @class V2QuoteProvider
 */
class V2QuoteProvider {
  constructor() {}
  async getQuotesManyExactIn(amountIns, routes) {
    return this.getQuotes(amountIns, routes, sdk_core_1.TradeType.EXACT_INPUT);
  }
  async getQuotesManyExactOut(amountOuts, routes) {
    return this.getQuotes(
      amountOuts,
      routes,
      sdk_core_1.TradeType.EXACT_OUTPUT
    );
  }
  async getQuotes(amounts, routes, tradeType) {
    console.log('v2 quotes');
    // console.log('amounts', amounts);
    routes = routes.filter((_, i) => i < 10);

    const routesWithQuotes = [];
    const debugStrs = [];
    for (const route of routes) {
      const amountQuotes = [];
      let insufficientInputAmountErrorCount = 0;
      let insufficientReservesErrorCount = 0;
      for (const amount of amounts) {
        try {
          if (tradeType == sdk_core_1.TradeType.EXACT_INPUT) {
            let outputAmount = amount.wrapped;
            for (const pair of route.pairs) {
              // ! ########################
              // ! ########################
              // console.log('\n ----Pair');
              // console.log(
              //   pair.tokenAmounts[0].currency.symbol,
              //   '=>',
              //   pair.tokenAmounts[1].currency.symbol
              // );

              // console.log(
              //   'outputAmount bef: ',
              //   outputAmount.numerator.toString(),
              //   outputAmount.currency.symbol
              // );

              // 1 WETH => 2,875.68 USDC
              const swapCall = {
                methodName: 'swapExactTokensForTokens',
                params: {
                  amountIn: '1000000000000000000',
                  amountOutMin: '2_875_680_000',
                  path: [
                    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                  ],
                  to: '0x0000000000000000000000000000000000000002',
                },
              };

              // console.log('outputAmount', outputAmount);

              const [outputAmountNew] = pair.getOutputAmount(outputAmount);

              pair.tokenAmounts[0].numerator = JSBI.BigInt(
                bignumber_1.BigNumber.from(
                  pair.tokenAmounts[0].numerator.toString()
                )
                  .mul(11)
                  .div(10)
                  .toString()
              );

              pair.tokenAmounts[1].numerator = JSBI.BigInt(
                bignumber_1.BigNumber.from(
                  pair.tokenAmounts[1].numerator.toString()
                )
                  .mul(9)
                  .div(10)
                  .toString()
              );

              const [outputAmountNewFuture] =
                pair.getOutputAmount(outputAmount);

              outputAmount = outputAmountNew;

              // console.log(
              //   'outputAmount aft: ',
              //   outputAmount.numerator.toString(),
              //   outputAmount.currency.symbol
              // );

              // console.log(
              //   'outputAmount fut: ',
              //   outputAmountNewFuture.numerator.toString(),
              //   outputAmountNewFuture.currency.symbol
              // );

              // console.log(util.inspect(pair, { depth: null }));

              // console.log('\n-- Present');
              // console.log(pair.liquidityToken.address);
              // console.log(pair.tokenAmounts[0].numerator.toString());
              // console.log(pair.tokenAmounts[1].numerator.toString());
              // console.log(outputAmountNew.numerator.toString());

              // console.log('\n-- Future');
              // console.log(pair.liquidityToken.address);
              // console.log(pair.tokenAmounts[0].numerator.toString());
              // console.log(pair.tokenAmounts[1].numerator.toString());
              // console.log(outputAmountNewFuture.numerator.toString());
            }
            amountQuotes.push({
              amount,
              quote: bignumber_1.BigNumber.from(
                outputAmount.quotient.toString()
              ),
            });
          } else {
            let inputAmount = amount.wrapped;
            for (let i = route.pairs.length - 1; i >= 0; i--) {
              const pair = route.pairs[i];
              [inputAmount] = pair.getInputAmount(inputAmount);
            }
            amountQuotes.push({
              amount,
              quote: bignumber_1.BigNumber.from(
                inputAmount.quotient.toString()
              ),
            });
          }
        } catch (err) {
          // Can fail to get quotes, e.g. throws InsufficientReservesError or InsufficientInputAmountError.
          if (err instanceof v2_sdk_1.InsufficientInputAmountError) {
            insufficientInputAmountErrorCount =
              insufficientInputAmountErrorCount + 1;
            amountQuotes.push({ amount, quote: null });
          } else if (err instanceof v2_sdk_1.InsufficientReservesError) {
            insufficientReservesErrorCount = insufficientReservesErrorCount + 1;
            amountQuotes.push({ amount, quote: null });
          } else {
            throw err;
          }
        }
      }
      if (
        insufficientInputAmountErrorCount > 0 ||
        insufficientReservesErrorCount > 0
      ) {
        debugStrs.push(
          `${[
            routes_1.routeToString(route),
          ]} Input: ${insufficientInputAmountErrorCount} Reserves: ${insufficientReservesErrorCount} }`
        );
      }
      routesWithQuotes.push([route, amountQuotes]);
    }
    if (debugStrs.length > 0) {
      log_1.log.info({ debugStrs }, `Failed quotes for V2 routes`);
    }
    return {
      routesWithQuotes,
    };
  }
}
exports.V2QuoteProvider = V2QuoteProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVvdGUtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvcHJvdmlkZXJzL3YyL3F1b3RlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHdEQUFxRDtBQUNyRCxnREFBOEM7QUFDOUMsNENBR3lCO0FBR3pCLHdDQUFxQztBQUNyQyw4Q0FBa0Q7QUFzQmxEOzs7Ozs7R0FNRztBQUNILE1BQWEsZUFBZTtJQUMxQixnQkFBZSxDQUFDO0lBRVQsS0FBSyxDQUFDLG9CQUFvQixDQUMvQixTQUEyQixFQUMzQixNQUFpQjtRQUVqQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxvQkFBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFTSxLQUFLLENBQUMscUJBQXFCLENBQ2hDLFVBQTRCLEVBQzVCLE1BQWlCO1FBRWpCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLG9CQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVPLEtBQUssQ0FBQyxTQUFTLENBQ3JCLE9BQXlCLEVBQ3pCLE1BQWlCLEVBQ2pCLFNBQW9CO1FBRXBCLE1BQU0sZ0JBQWdCLEdBQXdCLEVBQUUsQ0FBQztRQUVqRCxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFDL0IsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUU7WUFDMUIsTUFBTSxZQUFZLEdBQW9CLEVBQUUsQ0FBQztZQUV6QyxJQUFJLGlDQUFpQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxJQUFJLDhCQUE4QixHQUFHLENBQUMsQ0FBQztZQUN2QyxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtnQkFDNUIsSUFBSTtvQkFDRixJQUFJLFNBQVMsSUFBSSxvQkFBUyxDQUFDLFdBQVcsRUFBRTt3QkFDdEMsSUFBSSxZQUFZLEdBQUcsTUFBTSxD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
