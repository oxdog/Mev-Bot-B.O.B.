import { Token } from '@uniswap/sdk-core';
import { ITokenProvider } from '../../providers/token-provider';
import { ChainId } from '../../util/chains';
declare type ChainTokenList = {
    readonly [chainId in ChainId]: Token[];
};
export declare const BASES_TO_CHECK_TRADES_AGAINST: (_tokenProvider: ITokenProvider) => ChainTokenList;
export declare const ADDITIONAL_BASES: (tokenProvider: ITokenProvider) => Promise<{
    1?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    3?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    4?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    5?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    42?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    10?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    69?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    42161?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    421611?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    137?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    80001?: {
        [tokenAddress: string]: Token[];
    } | undefined;
}>;
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export declare const CUSTOM_BASES: (tokenProvider: ITokenProvider) => Promise<{
    1?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    3?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    4?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    5?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    42?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    10?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    69?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    42161?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    421611?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    137?: {
        [tokenAddress: string]: Token[];
    } | undefined;
    80001?: {
        [tokenAddress: string]: Token[];
    } | undefined;
}>;
export {};
