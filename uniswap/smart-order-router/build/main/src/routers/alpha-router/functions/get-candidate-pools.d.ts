import { Protocol } from '@uniswap/router-sdk';
import { Token, TradeType } from '@uniswap/sdk-core';
import { ITokenListProvider, IV2SubgraphProvider } from '../../../providers';
import { ITokenProvider } from '../../../providers/token-provider';
import { IV2PoolProvider, V2PoolAccessor } from '../../../providers/v2/pool-provider';
import { IV3PoolProvider, V3PoolAccessor } from '../../../providers/v3/pool-provider';
import { IV3SubgraphProvider } from '../../../providers/v3/subgraph-provider';
import { ChainId } from '../../../util';
import { AlphaRouterConfig } from '../alpha-router';
export declare type PoolId = {
    id: string;
};
export declare type CandidatePoolsBySelectionCriteria = {
    protocol: Protocol;
    selections: {
        topByBaseWithTokenIn: PoolId[];
        topByBaseWithTokenOut: PoolId[];
        topByDirectSwapPool: PoolId[];
        topByEthQuoteTokenPool: PoolId[];
        topByTVL: PoolId[];
        topByTVLUsingTokenIn: PoolId[];
        topByTVLUsingTokenOut: PoolId[];
        topByTVLUsingTokenInSecondHops: PoolId[];
        topByTVLUsingTokenOutSecondHops: PoolId[];
    };
};
export declare type V3GetCandidatePoolsParams = {
    tokenIn: Token;
    tokenOut: Token;
    routeType: TradeType;
    routingConfig: AlphaRouterConfig;
    subgraphProvider: IV3SubgraphProvider;
    tokenProvider: ITokenProvider;
    poolProvider: IV3PoolProvider;
    blockedTokenListProvider?: ITokenListProvider;
    chainId: ChainId;
};
export declare type V2GetCandidatePoolsParams = {
    tokenIn: Token;
    tokenOut: Token;
    routeType: TradeType;
    routingConfig: AlphaRouterConfig;
    subgraphProvider: IV2SubgraphProvider;
    tokenProvider: ITokenProvider;
    poolProvider: IV2PoolProvider;
    blockedTokenListProvider?: ITokenListProvider;
    chainId: ChainId;
};
export declare function getV3CandidatePools({ tokenIn, tokenOut, routeType, routingConfig, subgraphProvider, tokenProvider, poolProvider, blockedTokenListProvider, chainId, }: V3GetCandidatePoolsParams): Promise<{
    poolAccessor: V3PoolAccessor;
    candidatePools: CandidatePoolsBySelectionCriteria;
}>;
export declare function getV2CandidatePools({ tokenIn, tokenOut, routeType, routingConfig, subgraphProvider, tokenProvider, poolProvider, blockedTokenListProvider, chainId, }: V2GetCandidatePoolsParams): Promise<{
    poolAccessor: V2PoolAccessor;
    candidatePools: CandidatePoolsBySelectionCriteria;
}>;
