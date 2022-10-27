import { Token } from '@uniswap/sdk-core';
import { ChainId } from '../util';
import { IMulticallProvider } from './multicall-provider';
import { ProviderConfig } from './provider';
/**
 * Provider for getting token data.
 *
 * @export
 * @interface ITokenProvider
 */
export interface ITokenProvider {
    /**
     * Gets the token at each address. Any addresses that are not valid ERC-20 are ignored.
     *
     * @param addresses The token addresses to get.
     * @param [providerConfig] The provider config.
     * @returns A token accessor with methods for accessing the tokens.
     */
    getTokens(addresses: string[], providerConfig?: ProviderConfig): Promise<TokenAccessor>;
}
export declare type TokenAccessor = {
    getTokenByAddress(address: string): Token | undefined;
    getTokenBySymbol(symbol: string): Token | undefined;
    getAllTokens: () => Token[];
};
export declare const USDC_MAINNET: Token;
export declare const USDT_MAINNET: Token;
export declare const WBTC_MAINNET: Token;
export declare const DAI_MAINNET: Token;
export declare const FEI_MAINNET: Token;
export declare const USDC_ROPSTEN: Token;
export declare const USDT_ROPSTEN: Token;
export declare const DAI_ROPSTEN: Token;
export declare const DAI_RINKEBY_1: Token;
export declare const DAI_RINKEBY_2: Token;
export declare const USDC_RINKEBY: Token;
export declare const USDT_RINKEBY: Token;
export declare const USDC_GÖRLI: Token;
export declare const USDT_GÖRLI: Token;
export declare const WBTC_GÖRLI: Token;
export declare const DAI_GÖRLI: Token;
export declare const USDC_KOVAN: Token;
export declare const USDT_KOVAN: Token;
export declare const WBTC_KOVAN: Token;
export declare const DAI_KOVAN: Token;
export declare const USDC_OPTIMISM: Token;
export declare const USDT_OPTIMISM: Token;
export declare const WBTC_OPTIMISM: Token;
export declare const DAI_OPTIMISM: Token;
export declare const USDC_OPTIMISTIC_KOVAN: Token;
export declare const USDT_OPTIMISTIC_KOVAN: Token;
export declare const WBTC_OPTIMISTIC_KOVAN: Token;
export declare const DAI_OPTIMISTIC_KOVAN: Token;
export declare const USDC_ARBITRUM: Token;
export declare const USDT_ARBITRUM: Token;
export declare const WBTC_ARBITRUM: Token;
export declare const DAI_ARBITRUM: Token;
export declare const DAI_ARBITRUM_RINKEBY: Token;
export declare const USDT_ARBITRUM_RINKEBY: Token;
export declare const USDC_ARBITRUM_RINKEBY: Token;
export declare const UNI_ARBITRUM_RINKEBY: Token;
export declare const WMATIC_POLYGON: Token;
export declare const WETH_POLYGON: Token;
export declare const USDC_POLYGON: Token;
export declare const DAI_POLYGON: Token;
export declare const WMATIC_POLYGON_MUMBAI: Token;
export declare const USDC_POLYGON_MUMBAI: Token;
export declare const DAI_POLYGON_MUMBAI: Token;
export declare const WETH_POLYGON_MUMBAI: Token;
export declare class TokenProvider implements ITokenProvider {
    private chainId;
    protected multicall2Provider: IMulticallProvider;
    constructor(chainId: ChainId, multicall2Provider: IMulticallProvider);
    getTokens(_addresses: string[], providerConfig?: ProviderConfig): Promise<TokenAccessor>;
}
