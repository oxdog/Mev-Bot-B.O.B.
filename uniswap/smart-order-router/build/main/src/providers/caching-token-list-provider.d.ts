import { Token } from '@uniswap/sdk-core';
import { TokenList } from '@uniswap/token-lists';
import { ChainId } from '../util/chains';
import { ICache } from './cache';
import { ITokenProvider, TokenAccessor } from './token-provider';
/**
 * Provider for getting token data from a Token List.
 *
 * @export
 * @interface ITokenListProvider
 */
export interface ITokenListProvider {
    getTokenBySymbol(_symbol: string): Promise<Token | undefined>;
    getTokenByAddress(address: string): Promise<Token | undefined>;
}
export declare class CachingTokenListProvider implements ITokenProvider, ITokenListProvider {
    private tokenCache;
    private CACHE_KEY;
    private chainId;
    private chainToTokenInfos;
    private chainSymbolToTokenInfo;
    private chainAddressToTokenInfo;
    private tokenList;
    /**
     * Creates an instance of CachingTokenListProvider.
     * Token metadata (e.g. symbol and decimals) generally don't change so can be cached indefinitely.
     *
     * @param chainId The chain id to use.
     * @param tokenList The token list to get the tokens from.
     * @param tokenCache Cache instance to hold cached tokens.
     */
    constructor(chainId: ChainId | number, tokenList: TokenList, tokenCache: ICache<Token>);
    static fromTokenListURI(chainId: ChainId | number, tokenListURI: string, tokenCache: ICache<Token>): Promise<CachingTokenListProvider>;
    private static buildTokenList;
    static fromTokenList(chainId: ChainId | number, tokenList: TokenList, tokenCache: ICache<Token>): Promise<CachingTokenListProvider>;
    getTokens(_addresses: string[]): Promise<TokenAccessor>;
    getTokenBySymbol(_symbol: string): Promise<Token | undefined>;
    getTokenByAddress(address: string): Promise<Token | undefined>;
    private buildToken;
}
