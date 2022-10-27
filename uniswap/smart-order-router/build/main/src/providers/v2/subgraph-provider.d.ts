import { Token } from '@uniswap/sdk-core';
import { ChainId } from '../../util/chains';
import { ProviderConfig } from '../provider';
export interface V2SubgraphPool {
    id: string;
    token0: {
        id: string;
    };
    token1: {
        id: string;
    };
    supply: number;
    reserve: number;
}
/**
 * Provider for getting V2 pools from the Subgraph
 *
 * @export
 * @interface IV2SubgraphProvider
 */
export interface IV2SubgraphProvider {
    getPools(tokenIn?: Token, tokenOut?: Token, providerConfig?: ProviderConfig): Promise<V2SubgraphPool[]>;
}
export declare class V2SubgraphProvider implements IV2SubgraphProvider {
    private chainId;
    private retries;
    private timeout;
    private rollback;
    private client;
    constructor(chainId: ChainId, retries?: number, timeout?: number, rollback?: boolean);
    getPools(_tokenIn?: Token, _tokenOut?: Token, providerConfig?: ProviderConfig): Promise<V2SubgraphPool[]>;
}
