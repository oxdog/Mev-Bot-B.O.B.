import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import { GasPrice, IGasPriceProvider } from './gas-price-provider';
export declare type RawFeeHistoryResponse = {
    baseFeePerGas: string[];
    gasUsedRatio: number[];
    oldestBlock: string;
    reward: string[];
};
export declare type FeeHistoryResponse = {
    baseFeePerGas: BigNumber[];
    gasUsedRatio: number[];
    oldestBlock: BigNumber;
    reward: BigNumber[];
};
/**
 * Computes a gas estimate using on-chain data from the eth_feeHistory RPC endpoint.
 *
 * Takes the average priority fee from the past `blocksToConsider` blocks, and adds it
 * to the current base fee.
 *
 * @export
 * @class EIP1559GasPriceProvider
 */
export declare class EIP1559GasPriceProvider extends IGasPriceProvider {
    protected provider: JsonRpcProvider;
    private priorityFeePercentile;
    private blocksToConsider;
    constructor(provider: JsonRpcProvider, priorityFeePercentile?: number, blocksToConsider?: number);
    getGasPrice(): Promise<GasPrice>;
}
