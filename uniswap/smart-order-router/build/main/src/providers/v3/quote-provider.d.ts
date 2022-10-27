import { BigNumber } from '@ethersproject/bignumber';
import { BaseProvider } from '@ethersproject/providers';
import { Options as RetryOptions } from 'async-retry';
import { V3Route } from '../../routers/router';
import { ChainId } from '../../util';
import { CurrencyAmount } from '../../util/amounts';
import { Result } from '../multicall-provider';
import { UniswapMulticallProvider } from '../multicall-uniswap-provider';
import { ProviderConfig } from '../provider';
/**
 * A quote for a swap on V3.
 */
export declare type V3AmountQuote = {
    amount: CurrencyAmount;
    /**
     * Quotes can be null (e.g. pool did not have enough liquidity).
     */
    quote: BigNumber | null;
    /**
     * For each pool in the route, the sqrtPriceX96 after the swap.
     */
    sqrtPriceX96AfterList: BigNumber[] | null;
    /**
     * For each pool in the route, the number of ticks crossed.
     */
    initializedTicksCrossedList: number[] | null;
    /**
     * An estimate of the gas used by the swap. This is returned by the multicall
     * and is not necessarily accurate due to EIP-2929 causing gas costs to vary
     * depending on if the slot has already been loaded in the call.
     */
    gasEstimate: BigNumber | null;
};
export declare class BlockConflictError extends Error {
    name: string;
}
export declare class SuccessRateError extends Error {
    name: string;
}
export declare class ProviderBlockHeaderError extends Error {
    name: string;
}
export declare class ProviderTimeoutError extends Error {
    name: string;
}
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
export declare class ProviderGasError extends Error {
    name: string;
}
export declare type QuoteRetryOptions = RetryOptions;
/**
 * The V3 route and a list of quotes for that route.
 */
export declare type V3RouteWithQuotes = [V3Route, V3AmountQuote[]];
/**
 * Provider for getting quotes on Uniswap V3.
 *
 * @export
 * @interface IV3QuoteProvider
 */
export interface IV3QuoteProvider {
    /**
     * For every route, gets an exactIn quotes on V3 for every amount provided.
     *
     * @param amountIns The amounts to get quotes for.
     * @param routes The routes to get quotes for.
     * @param [providerConfig] The provider config.
     * @returns For each route returns a V3RouteWithQuotes object that contains all the quotes.
     * @returns The blockNumber used when generating the quotes.
     */
    getQuotesManyExactIn(amountIns: CurrencyAmount[], routes: V3Route[], providerConfig?: ProviderConfig): Promise<{
        routesWithQuotes: V3RouteWithQuotes[];
        blockNumber: BigNumber;
    }>;
    /**
     * For every route, gets ane exactOut quote on V3 for every amount provided.
     *
     * @param amountOuts The amounts to get quotes for.
     * @param routes The routes to get quotes for.
     * @param [providerConfig] The provider config.
     * @returns For each route returns a V3RouteWithQuotes object that contains all the quotes.
     * @returns The blockNumber used when generating the quotes.
     */
    getQuotesManyExactOut(amountOuts: CurrencyAmount[], routes: V3Route[], providerConfig?: ProviderConfig): Promise<{
        routesWithQuotes: V3RouteWithQuotes[];
        blockNumber: BigNumber;
    }>;
}
/**
 * The parameters for the multicalls we make.
 *
 * It is important to ensure that (gasLimitPerCall * multicallChunk) < providers gas limit per call.
 *
 * V3 quotes can consume a lot of gas (if the swap is so large that it swaps through a large
 * number of ticks), so there is a risk of exceeded gas limits in these multicalls.
 */
export declare type BatchParams = {
    /**
     * The number of quotes to fetch in each multicall.
     */
    multicallChunk: number;
    /**
     * The maximum call to consume for each quote in the multicall.
     */
    gasLimitPerCall: number;
    /**
     * The minimum success rate for all quotes across all multicalls.
     * If we set our gasLimitPerCall too low it could result in a large number of
     * quotes failing due to out of gas. This parameters will fail the overall request
     * in this case.
     */
    quoteMinSuccessRate: number;
};
/**
 * The fallback values for gasLimit and multicallChunk if any failures occur.
 *
 */
export declare type FailureOverrides = {
    multicallChunk: number;
    gasLimitOverride: number;
};
export declare type BlockHeaderFailureOverridesDisabled = {
    enabled: false;
};
export declare type BlockHeaderFailureOverridesEnabled = {
    enabled: true;
    rollbackBlockOffset: number;
    attemptsBeforeRollback: number;
};
export declare type BlockHeaderFailureOverrides = BlockHeaderFailureOverridesDisabled | BlockHeaderFailureOverridesEnabled;
/**
 * Config around what block number to query and how to handle failures due to block header errors.
 */
export declare type BlockNumberConfig = {
    baseBlockOffset: number;
    rollback: BlockHeaderFailureOverrides;
};
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
export declare class V3QuoteProvider implements IV3QuoteProvider {
    protected chainId: ChainId;
    protected provider: BaseProvider;
    protected multicall2Provider: UniswapMulticallProvider;
    protected retryOptions: QuoteRetryOptions;
    protected batchParams: BatchParams;
    protected gasErrorFailureOverride: FailureOverrides;
    protected successRateFailureOverrides: FailureOverrides;
    protected blockNumberConfig: BlockNumberConfig;
    protected quoterAddressOverride?: string | undefined;
    protected quoterAddress: string;
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
    constructor(chainId: ChainId, provider: BaseProvider, multicall2Provider: UniswapMulticallProvider, retryOptions?: QuoteRetryOptions, batchParams?: BatchParams, gasErrorFailureOverride?: FailureOverrides, successRateFailureOverrides?: FailureOverrides, blockNumberConfig?: BlockNumberConfig, quoterAddressOverride?: string | undefined);
    getQuotesManyExactIn(amountIns: CurrencyAmount[], routes: V3Route[], providerConfig?: ProviderConfig): Promise<{
        routesWithQuotes: V3RouteWithQuotes[];
        blockNumber: BigNumber;
    }>;
    getQuotesManyExactOut(amountOuts: CurrencyAmount[], routes: V3Route[], providerConfig?: ProviderConfig): Promise<{
        routesWithQuotes: V3RouteWithQuotes[];
        blockNumber: BigNumber;
    }>;
    private getQuotesManyData;
    private partitionQuotes;
    private processQuoteResults;
    private validateBlockNumbers;
    protected validateSuccessRate(allResults: Result<[BigNumber, BigNumber[], number[], BigNumber]>[], haveRetriedForSuccessRate: boolean): void | SuccessRateError;
}
