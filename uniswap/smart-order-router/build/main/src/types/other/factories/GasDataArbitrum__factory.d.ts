import { Provider } from "@ethersproject/providers";
import { Signer } from "ethers";
import type { GasDataArbitrum, GasDataArbitrumInterface } from "../GasDataArbitrum";
export declare class GasDataArbitrum__factory {
    static readonly abi: {
        inputs: never[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): GasDataArbitrumInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): GasDataArbitrum;
}
