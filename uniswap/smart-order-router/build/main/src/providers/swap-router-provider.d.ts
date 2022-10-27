import { ApprovalTypes } from '@uniswap/router-sdk';
import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
import { IMulticallProvider } from './multicall-provider';
declare type TokenApprovalTypes = {
    approvalTokenIn: ApprovalTypes;
    approvalTokenOut: ApprovalTypes;
};
/**
 * Provider for accessing the SwapRouter02 Contract .
 *
 * @export
 * @interface IRouterProvider
 */
export interface ISwapRouterProvider {
    /**
     * Get the approval method needed for each token. Throws an error if either query fails.
     *
     * @param tokenInAmount The Currency Amount of tokenIn needed by the user
     * @param tokenOutAmount The Currency Amount of tokenOut needed by the user
     * @returns the Approval Types for each token.
     */
    getApprovalType(tokenInAmount: CurrencyAmount<Currency>, tokenOutAmount: CurrencyAmount<Currency>): Promise<TokenApprovalTypes>;
}
export declare class SwapRouterProvider implements ISwapRouterProvider {
    protected multicall2Provider: IMulticallProvider;
    constructor(multicall2Provider: IMulticallProvider);
    getApprovalType(tokenInAmount: CurrencyAmount<Currency>, tokenOutAmount: CurrencyAmount<Currency>): Promise<TokenApprovalTypes>;
}
export {};
