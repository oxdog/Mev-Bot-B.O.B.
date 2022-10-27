import { Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import { Options as RetryOptions } from 'async-retry';
import { ChainId } from '../../util';
import { IMulticallProvider } from '../multicall-provider';
import { ProviderConfig } from '../provider';
/**
 * Provider for getting V2 pools.
 *
 * @export
 * @interface IV2PoolProvider
 */
export interface IV2PoolProvider {
    /**
     * Gets the pools for the specified token pairs.
     *
     * @param tokenPairs The token pairs to get.
     * @param [providerConfig] The provider config.
     * @returns A pool accessor with methods for accessing the pools.
     */
    getPools(tokenPairs: [Token, Token][], providerConfig?: ProviderConfig): Promise<V2PoolAccessor>;
    /**
     * Gets the pool address for the specified token pair.
     *
     * @param tokenA Token A in the pool.
     * @param tokenB Token B in the pool.
     * @returns The pool address and the two tokens.
     */
    getPoolAddress(tokenA: Token, tokenB: Token): {
        poolAddress: string;
        token0: Token;
        token1: Token;
    };
}
export declare type V2PoolAccessor = {
    getPool: (tokenA: Token, tokenB: Token) => Pair | undefined;
    getPoolByAddress: (address: string) => Pair | undefined;
    getAllPools: () => Pair[];
};
export declare type V2PoolRetryOptions = RetryOptions;
export declare class V2PoolProvider implements IV2PoolProvider {
    protected chainId: ChainId;
    protected multicall2Provider: IMulticallProvider;
    protected retryOptions: V2PoolRetryOptions;
    private POOL_ADDRESS_CACHE;
    /**
     * Creates an instance of V2PoolProvider.
     * @param chainId The chain id to use.
     * @param multicall2Provider The multicall provider to use to get the pools.
     * @param retryOptions The retry options for each call to the multicall.
     */
    constructor(chainId: ChainId, multicall2Provider: IMulticallProvider, retryOptions?: V2PoolRetryOptions);
    getPools(tokenPairs: [Token, Token][], providerConfig?: ProviderConfig): Promise<V2PoolAccessor>;
    getPoolAddress(tokenA: Token, tokenB: Token): {
        poolAddress: string;
        token0: Token;
        token1: Token;
    };
    private getPoolsData;
}
