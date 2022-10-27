import { Currency, TradeType } from '@uniswap/sdk-core';
import { IMulticallProvider } from '../../providers/multicall-provider';
import { ITokenProvider } from '../../providers/token-provider';
import { IV3PoolProvider } from '../../providers/v3/pool-provider';
import { IV3QuoteProvider } from '../../providers/v3/quote-provider';
import { CurrencyAmount } from '../../util/amounts';
import { ChainId } from '../../util/chains';
import { IRouter, SwapOptions, SwapRoute } from '../router';
export declare type LegacyRouterParams = {
    chainId: ChainId;
    multicall2Provider: IMulticallProvider;
    poolProvider: IV3PoolProvider;
    quoteProvider: IV3QuoteProvider;
    tokenProvider: ITokenProvider;
};
export declare type LegacyRoutingConfig = {
    blockNumber?: number;
};
/**
 * Replicates the router implemented in the V3 interface.
 * Code is mostly a copy from https://github.com/Uniswap/uniswap-interface/blob/0190b5a408c13016c87e1030ffc59326c085f389/src/hooks/useBestV3Trade.ts#L22-L23
 * with React/Redux hooks removed, and refactoring to allow re-use in other routers.
 */
export declare class LegacyRouter implements IRouter<LegacyRoutingConfig> {
    protected chainId: ChainId;
    protected multicall2Provider: IMulticallProvider;
    protected poolProvider: IV3PoolProvider;
    protected quoteProvider: IV3QuoteProvider;
    protected tokenProvider: ITokenProvider;
    constructor({ chainId, multicall2Provider, poolProvider, quoteProvider, tokenProvider, }: LegacyRouterParams);
    route(amount: CurrencyAmount, quoteCurrency: Currency, swapType: TradeType, swapConfig?: SwapOptions, partialRoutingConfig?: Partial<LegacyRoutingConfig>): Promise<SwapRoute | null>;
    routeExactIn(currencyIn: Currency, currencyOut: Currency, amountIn: CurrencyAmount, swapConfig?: SwapOptions, routingConfig?: LegacyRoutingConfig): Promise<SwapRoute | null>;
    routeExactOut(currencyIn: Currency, currencyOut: Currency, amountOut: CurrencyAmount, swapConfig?: SwapOptions, routingConfig?: LegacyRoutingConfig): Promise<SwapRoute | null>;
    private findBestRouteExactIn;
    private findBestRouteExactOut;
    private getBestQuote;
    private getAllRoutes;
    private getAllPossiblePairings;
    private computeAllRoutes;
    private buildTrade;
    private buildMethodParameters;
}
