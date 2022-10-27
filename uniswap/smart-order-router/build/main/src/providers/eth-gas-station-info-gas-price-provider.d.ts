import { GasPrice, IGasPriceProvider } from './gas-price-provider';
export declare type ETHGasStationResponse = {
    fast: number;
    fastest: number;
    safeLow: number;
    average: number;
    block_time: number;
    blockNum: number;
    speed: number;
    safeLowWait: number;
    avgWait: number;
    fastWait: number;
    fastestWait: number;
};
export declare class ETHGasStationInfoProvider extends IGasPriceProvider {
    private url;
    constructor(url: string);
    getGasPrice(): Promise<GasPrice>;
}
