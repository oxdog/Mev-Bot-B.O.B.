import { BaseProvider } from '@ethersproject/providers';
import { Protocol } from '@uniswap/router-sdk';
import { Currency, TradeType } from '@uniswap/sdk-core';
import { Position } from '@uniswap/v3-sdk';
import { ISwapRouterProvider, IV2QuoteProvider, IV2SubgraphProvider, UniswapMulticallProvider } from '../../providers';
import { ITokenListProvider } from '../../providers/caching-token-list-provider';
import { IGasPriceProvider } from '../../providers/gas-price-provider';
import { ITokenProvider } from '../../providers/token-provider';
import { ITokenValidatorProvider } from '../../providers/token-validator-provider';
import { IV2PoolProvider } from '../../providers/v2/pool-provider';
import { ArbitrumGasData, IL2GasDataProvider, OptimismGasData } from '../../providers/v3/gas-data-provider';
import { IV3PoolProvider } from '../../providers/v3/pool-provider';
import { IV3QuoteProvider } from '../../providers/v3/quote-provider';
import { IV3SubgraphProvider } from '../../providers/v3/subgraph-provider';
import { CurrencyAmount } from '../../util/amounts';
import { ChainId } from '../../util/chains';
import { IRouter, ISwapToRatio, SwapAndAddConfig, SwapAndAddOptions, SwapOptions, SwapRoute, SwapToRatioResponse } from '../router';
import { IV2GasModelFactory, IV3GasModelFactory } from './gas-models/gas-model';
export declare type AlphaRouterParams = {
    /**
     * The chain id for this instance of the Alpha Router.
     */
    chainId: ChainId;
    /**
     * The Web3 provider for getting on-chain data.
     */
    provider: BaseProvider;
    /**
     * The provider to use for making multicalls. Used for getting on-chain data
     * like pools, tokens, quotes in batch.
     */
    multicall2Provider?: UniswapMulticallProvider;
    /**
     * The provider for getting all pools that exist on V3 from the Subgraph. The pools
     * from this provider are filtered during the algorithm to a set of candidate pools.
     */
    v3SubgraphProvider?: IV3SubgraphProvider;
    /**
     * The provider for getting data about V3 pools.
     */
    v3PoolProvider?: IV3PoolProvider;
    /**
     * The provider for getting V3 quotes.
     */
    v3QuoteProvider?: IV3QuoteProvider;
    /**
     * The provider for getting all pools that exist on V2 from the Subgraph. The pools
     * from this provider are filtered during the algorithm to a set of candidate pools.
     */
    v2SubgraphProvider?: IV2SubgraphProvider;
    /**
     * The provider for getting data about V2 pools.
     */
    v2PoolProvider?: IV2PoolProvider;
    /**
     * The provider for getting V3 quotes.
     */
    v2QuoteProvider?: IV2QuoteProvider;
    /**
     * The provider for getting data about Tokens.
     */
    tokenProvider?: ITokenProvider;
    /**
     * The provider for getting the current gas price to use when account for gas in the
     * algorithm.
     */
    gasPriceProvider?: IGasPriceProvider;
    /**
     * A factory for generating a gas model that is used when estimating the gas used by
     * V3 routes.
     */
    v3GasModelFactory?: IV3GasModelFactory;
    /**
     * A factory for generating a gas model that is used when estimating the gas used by
     * V2 routes.
     */
    v2GasModelFactory?: IV2GasModelFactory;
    /**
     * A token list that specifies Token that should be blocked from routing through.
     * Defaults to Uniswap's unsupported token list.
     */
    blockedTokenListProvider?: ITokenListProvider;
    /**
     * Calls lens function on SwapRouter02 to determine ERC20 approval types for
     * LP position tokens.
     */
    swapRouterProvider?: ISwapRouterProvider;
    /**
     * Calls the optimism gas oracle contract to fetch constants for calculating the l1 security fee.
     */
    optimismGasDataProvider?: IL2GasDataProvider<OptimismGasData>;
    /**
     * A token validator for detecting fee-on-transfer tokens or tokens that can't be transferred.
     */
    tokenValidatorProvider?: ITokenValidatorProvider;
    /**
     * Calls the arbitrum gas data contract to fetch constants for calculating the l1 fee.
     */
    arbitrumGasDataProvider?: IL2GasDataProvider<ArbitrumGasData>;
};
/**
 * Determines the pools that the algorithm will consider when finding the optimal swap.
 *
 * All pools on each protocol are filtered based on the heuristics specified here to generate
 * the set of candidate pools. The Top N pools are taken by Total Value Locked (TVL).
 *
 * Higher values here result in more pools to explore which results in higher latency.
 */
export declare type ProtocolPoolSelection = {
    /**
     * The top N pools by TVL out of all pools on the protocol.
     */
    topN: number;
    /**
     * The top N pools by TVL of pools that consist of tokenIn and tokenOut.
     */
    topNDirectSwaps: number;
    /**
     * The top N pools by TVL of pools where one token is tokenIn and the
     * top N pools by TVL of pools where one token is tokenOut tokenOut.
     */
    topNTokenInOut: number;
    /**
     * Given the topNTokenInOut pools, gets the top N pools that involve the other token.
     * E.g. for a WETH -> USDC swap, if topNTokenInOut found WETH -> DAI and WETH -> USDT,
     * a value of 2 would find the top 2 pools that involve DAI or USDT.
     */
    topNSecondHop: number;
    /**
     * The top N pools for token in and token out that involve a token from a list of
     * hardcoded 'base tokens'. These are standard tokens such as WETH, USDC, DAI, etc.
     * This is similar to how the legacy routing algorithm used by Uniswap would select
     * pools and is intended to make the new pool selection algorithm close to a superset
     * of the old algorithm.
     */
    topNWithEachBaseToken: number;
    /**
     * Given the topNWithEachBaseToken pools, takes the top N pools from the full list.
     * E.g. for a WETH -> USDC swap, if topNWithEachBaseToken found WETH -0.05-> DAI,
     * WETH -0.01-> DAI, WETH -0.05-> USDC, WETH -0.3-> USDC, a value of 2 would reduce
     * this set to the top 2 pools from that full list.
     */
    topNWithBaseToken: number;
};
export declare type AlphaRouterConfig = {
    /**
     * The block number to use for all on-chain data. If not provided, the router will
     * use the latest block returned by the provider.
     */
    blockNumber?: number | Promise<number>;
    /**
     * The protocols to consider when finding the optimal swap. If not provided all protocols
     * will be used.
     */
    protocols?: Protocol[];
    /**
     * Config for selecting which pools to consider routing via on V2.
     */
    v2PoolSelection: ProtocolPoolSelection;
    /**
     * Config for selecting which pools to consider routing via on V3.
     */
    v3PoolSelection: ProtocolPoolSelection;
    /**
     * For each route, the maximum number of hops to consider. More hops will increase latency of the algorithm.
     */
    maxSwapsPerPath: number;
    /**
     * The maximum number of splits in the returned route. A higher maximum will increase latency of the algorithm.
     */
    maxSplits: number;
    /**
     * The minimum number of splits in the returned route.
     * This parameters should always be set to 1. It is only included for testing purposes.
     */
    minSplits: number;
    /**
     * Forces the returned swap to route across all protocols.
     * This parameter should always be false. It is only included for testing purposes.
     */
    forceCrossProtocol: boolean;
    /**
     * The minimum percentage of the input token to use for each route in a split route.
     * All routes will have a multiple of this value. For example is distribution percentage is 5,
     * a potential return swap would be:
     *
     * 5% of input => Route 1
     * 55% of input => Route 2
     * 40% of input => Route 3
     */
    distributionPercent: number;
};
export declare class AlphaRouter implements IRouter<AlphaRouterConfig>, ISwapToRatio<AlphaRouterConfig, SwapAndAddConfig> {
    protected chainId: ChainId;
    protected provider: BaseProvider;
    protected multicall2Provider: UniswapMulticallProvider;
    protected v3SubgraphProvider: IV3SubgraphProvider;
    protected v3PoolProvider: IV3PoolProvider;
    protected v3QuoteProvider: IV3QuoteProvider;
    protected v2SubgraphProvider: IV2SubgraphProvider;
    protected v2PoolProvider: IV2PoolProvider;
    protected v2QuoteProvider: IV2QuoteProvider;
    protected tokenProvider: ITokenProvider;
    protected gasPriceProvider: IGasPriceProvider;
    protected swapRouterProvider: ISwapRouterProvider;
    protected v3GasModelFactory: IV3GasModelFactory;
    protected v2GasModelFactory: IV2GasModelFactory;
    protected tokenValidatorProvider?: ITokenValidatorProvider;
    protected blockedTokenListProvider?: ITokenListProvider;
    protected l2GasDataProvider?: IL2GasDataProvider<OptimismGasData> | IL2GasDataProvider<ArbitrumGasData>;
    constructor({ chainId, provider, multicall2Provider, v3PoolProvider, v3QuoteProvider, v2PoolProvider, v2QuoteProvider, v2SubgraphProvider, tokenProvider, blockedTokenListProvider, v3SubgraphProvider, gasPriceProvider, v3GasModelFactory, v2GasModelFactory, swapRouterProvider, optimismGasDataProvider, tokenValidatorProvider, arbitrumGasDataProvider, }: AlphaRouterParams);
    routeToRatio(token0Balance: CurrencyAmount, token1Balance: CurrencyAmount, position: Position, swapAndAddConfig: SwapAndAddConfig, swapAndAddOptions?: SwapAndAddOptions, routingConfig?: Partial<AlphaRouterConfig>): Promise<SwapToRatioResponse>;
    /**
     * @inheritdoc IRouter
     */
    route(amount: CurrencyAmount, quoteCurrency: Currency, tradeType: TradeType, swapConfig?: SwapOptions, partialRoutingConfig?: Partial<AlphaRouterConfig>): Promise<SwapRoute | null>;
    private applyTokenValidatorToPools;
    private getV3Quotes;
    private getV2Quotes;
    private getAmountDistribution;
    private buildSwapAndAddMethodParameters;
    private emitPoolSelectionMetrics;
    private calculateOptimalRatio;
    private absoluteValue;
    private getBlockNumberPromise;
}
