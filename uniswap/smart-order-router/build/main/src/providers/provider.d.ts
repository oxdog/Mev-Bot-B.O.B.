export declare type ProviderConfig = {
    /**
     * The block number to use when getting data on-chain.
     */
    blockNumber?: number | Promise<number>;
};
export declare type LocalCacheEntry<T> = {
    entry: T;
    blockNumber: number;
};
