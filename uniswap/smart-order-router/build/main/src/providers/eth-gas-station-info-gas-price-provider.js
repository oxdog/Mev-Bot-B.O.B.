"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETHGasStationInfoProvider = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const async_retry_1 = __importDefault(require("async-retry"));
const axios_1 = __importDefault(require("axios"));
const log_1 = require("../util/log");
const gas_price_provider_1 = require("./gas-price-provider");
class ETHGasStationInfoProvider extends gas_price_provider_1.IGasPriceProvider {
    constructor(url) {
        super();
        this.url = url;
    }
    async getGasPrice() {
        log_1.log.info(`About to get gas prices from gas station ${this.url}`);
        const response = await async_retry_1.default(async () => {
            return axios_1.default.get(this.url);
        }, { retries: 1 });
        const { data: gasPriceResponse, status } = response;
        if (status != 200) {
            log_1.log.error({ response }, `Unabled to get gas price from ${this.url}.`);
            throw new Error(`Unable to get gas price from ${this.url}`);
        }
        log_1.log.info({ gasPriceResponse }, 'Gas price response from API. About to parse "fast" to big number');
        // Gas prices from ethgasstation are in GweiX10.
        const gasPriceWei = bignumber_1.BigNumber.from(gasPriceResponse.fast)
            .div(bignumber_1.BigNumber.from(10))
            .mul(bignumber_1.BigNumber.from(10).pow(9));
        log_1.log.info(`Gas price in wei: ${gasPriceWei} as of block ${gasPriceResponse.blockNum}`);
        return { gasPriceWei: gasPriceWei };
    }
}
exports.ETHGasStationInfoProvider = ETHGasStationInfoProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXRoLWdhcy1zdGF0aW9uLWluZm8tZ2FzLXByaWNlLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9ldGgtZ2FzLXN0YXRpb24taW5mby1nYXMtcHJpY2UtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsd0RBQXFEO0FBQ3JELDhEQUFnQztBQUNoQyxrREFBMEI7QUFDMUIscUNBQWtDO0FBQ2xDLDZEQUFtRTtBQWlCbkUsTUFBYSx5QkFBMEIsU0FBUSxzQ0FBaUI7SUFFOUQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVNLEtBQUssQ0FBQyxXQUFXO1FBQ3RCLFNBQUcsQ0FBQyxJQUFJLENBQUMsNENBQTRDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sUUFBUSxHQUFHLE1BQU0scUJBQUssQ0FDMUIsS0FBSyxJQUFJLEVBQUU7WUFDVCxPQUFPLGVBQUssQ0FBQyxHQUFHLENBQXdCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxDQUFDLEVBQ0QsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQ2YsQ0FBQztRQUVGLE1BQU0sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDO1FBRXBELElBQUksTUFBTSxJQUFJLEdBQUcsRUFBRTtZQUNqQixTQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsaUNBQWlDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQzdEO1FBRUQsU0FBRyxDQUFDLElBQUksQ0FDTixFQUFFLGdCQUFnQixFQUFFLEVBQ3BCLGtFQUFrRSxDQUNuRSxDQUFDO1FBRUYsZ0RBQWdEO1FBQ2hELE1BQU0sV0FBVyxHQUFHLHFCQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQzthQUN0RCxHQUFHLENBQUMscUJBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDdkIsR0FBRyxDQUFDLHFCQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWxDLFNBQUcsQ0FBQyxJQUFJLENBQ04scUJBQXFCLFdBQVcsZ0JBQWdCLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUM1RSxDQUFDO1FBRUYsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7QUF4Q0QsOERBd0NDIn0=