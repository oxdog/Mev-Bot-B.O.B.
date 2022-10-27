import { JsonRpcProvider } from '@ethersproject/providers';
import { GasPrice, IGasPriceProvider } from './gas-price-provider';
export declare class LegacyGasPriceProvider extends IGasPriceProvider {
    protected provider: JsonRpcProvider;
    constructor(provider: JsonRpcProvider);
    getGasPrice(): Promise<GasPrice>;
}
