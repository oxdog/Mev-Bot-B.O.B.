"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EIP1559GasPriceProvider = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const lodash_1 = __importDefault(require("lodash"));
const log_1 = require("../util/log");
const gas_price_provider_1 = require("./gas-price-provider");
// We get the Xth percentile of priority fees for transactions successfully included in previous blocks.
const DEFAULT_PRIORITY_FEE_PERCENTILE = 50;
// Infura docs say only past 4 blocks guaranteed to be available: https://infura.io/docs/ethereum#operation/eth_feeHistory
const DEFAULT_BLOCKS_TO_LOOK_BACK = 4;
/**
 * Computes a gas estimate using on-chain data from the eth_feeHistory RPC endpoint.
 *
 * Takes the average priority fee from the past `blocksToConsider` blocks, and adds it
 * to the current base fee.
 *
 * @export
 * @class EIP1559GasPriceProvider
 */
class EIP1559GasPriceProvider extends gas_price_provider_1.IGasPriceProvider {
    constructor(provider, priorityFeePercentile = DEFAULT_PRIORITY_FEE_PERCENTILE, blocksToConsider = DEFAULT_BLOCKS_TO_LOOK_BACK) {
        super();
        this.provider = provider;
        this.priorityFeePercentile = priorityFeePercentile;
        this.blocksToConsider = blocksToConsider;
    }
    async getGasPrice() {
        const feeHistoryRaw = (await this.provider.send('eth_feeHistory', [
            this.blocksToConsider,
            'latest',
            [this.priorityFeePercentile],
        ]));
        const feeHistory = {
            baseFeePerGas: lodash_1.default.map(feeHistoryRaw.baseFeePerGas, (b) => bignumber_1.BigNumber.from(b)),
            gasUsedRatio: feeHistoryRaw.gasUsedRatio,
            oldestBlock: bignumber_1.BigNumber.from(feeHistoryRaw.oldestBlock),
            reward: lodash_1.default.map(feeHistoryRaw.reward, (b) => bignumber_1.BigNumber.from(b[0])),
        };
        const nextBlockBaseFeePerGas = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
        const averagePriorityFeePerGas = lodash_1.default.reduce(feeHistory.reward, (sum, cur) => sum.add(cur), bignumber_1.BigNumber.from(0)).div(feeHistory.reward.length);
        log_1.log.info({
            feeHistory,
            feeHistoryReadable: {
                baseFeePerGas: lodash_1.default.map(feeHistory.baseFeePerGas, (f) => f.toString()),
                oldestBlock: feeHistory.oldestBlock.toString(),
                reward: lodash_1.default.map(feeHistory.reward, (r) => r.toString()),
            },
            nextBlockBaseFeePerGas: nextBlockBaseFeePerGas.toString(),
            averagePriorityFeePerGas: averagePriorityFeePerGas.toString(),
        }, 'Got fee history from provider and computed gas estimate');
        const gasPriceWei = nextBlockBaseFeePerGas.add(averagePriorityFeePerGas);
        const blockNumber = feeHistory.oldestBlock.add(this.blocksToConsider);
        log_1.log.info(`Estimated gas price in wei: ${gasPriceWei} as of block ${blockNumber.toString()}`);
        return { gasPriceWei: gasPriceWei };
    }
}
exports.EIP1559GasPriceProvider = EIP1559GasPriceProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWlwLTE1NTktZ2FzLXByaWNlLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9laXAtMTU1OS1nYXMtcHJpY2UtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsd0RBQXFEO0FBRXJELG9EQUF1QjtBQUN2QixxQ0FBa0M7QUFDbEMsNkRBQW1FO0FBZ0JuRSx3R0FBd0c7QUFDeEcsTUFBTSwrQkFBK0IsR0FBRyxFQUFFLENBQUM7QUFDM0MsMEhBQTBIO0FBQzFILE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxDQUFDO0FBRXRDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBYSx1QkFBd0IsU0FBUSxzQ0FBaUI7SUFDNUQsWUFDWSxRQUF5QixFQUMzQix3QkFBZ0MsK0JBQStCLEVBQy9ELG1CQUEyQiwyQkFBMkI7UUFFOUQsS0FBSyxFQUFFLENBQUM7UUFKRSxhQUFRLEdBQVIsUUFBUSxDQUFpQjtRQUMzQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQTBDO1FBQy9ELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBc0M7SUFHaEUsQ0FBQztJQUVNLEtBQUssQ0FBQyxXQUFXO1FBQ3RCLE1BQU0sYUFBYSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUNoRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3JCLFFBQVE7WUFDUixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztTQUM3QixDQUFDLENBQTBCLENBQUM7UUFFN0IsTUFBTSxVQUFVLEdBQXVCO1lBQ3JDLGFBQWEsRUFBRSxnQkFBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FDdEQscUJBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQ2xCO1lBQ0QsWUFBWSxFQUFFLGFBQWEsQ0FBQyxZQUFZO1lBQ3hDLFdBQVcsRUFBRSxxQkFBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO1lBQ3RELE1BQU0sRUFBRSxnQkFBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxxQkFBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNqRSxDQUFDO1FBRUYsTUFBTSxzQkFBc0IsR0FDMUIsVUFBVSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQztRQUVqRSxNQUFNLHdCQUF3QixHQUFHLGdCQUFDLENBQUMsTUFBTSxDQUN2QyxVQUFVLENBQUMsTUFBTSxFQUNqQixDQUFDLEdBQWMsRUFBRSxHQUFjLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQ2hELHFCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUNsQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWhDLFNBQUcsQ0FBQyxJQUFJLENBQ047WUFDRSxVQUFVO1lBQ1Ysa0JBQWtCLEVBQUU7Z0JBQ2xCLGFBQWEsRUFBRSxnQkFBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25FLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRTtnQkFDOUMsTUFBTSxFQUFFLGdCQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUN0RDtZQUNELHNCQUFzQixFQUFFLHNCQUFzQixDQUFDLFFBQVEsRUFBRTtZQUN6RCx3QkFBd0IsRUFBRSx3QkFBd0IsQ0FBQyxRQUFRLEVBQUU7U0FDOUQsRUFDRCx5REFBeUQsQ0FDMUQsQ0FBQztRQUVGLE1BQU0sV0FBVyxHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRXpFLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXRFLFNBQUcsQ0FBQyxJQUFJLENBQ04sK0JBQStCLFdBQVcsZ0JBQWdCLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUNuRixDQUFDO1FBRUYsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7QUExREQsMERBMERDIn0=