"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachingGasStationProvider = void 0;
const log_1 = require("../util/log");
/**
 * Provider for getting gas price, with functionality for caching the results.
 *
 * @export
 * @class CachingV3SubgraphProvider
 */
class CachingGasStationProvider {
    /**
     * Creates an instance of CachingGasStationProvider.
     * @param chainId The chain id to use.
     * @param gasPriceProvider The provider to use to get the gas price when not in the cache.
     * @param cache Cache instance to hold cached pools.
     */
    constructor(chainId, gasPriceProvider, cache) {
        this.chainId = chainId;
        this.gasPriceProvider = gasPriceProvider;
        this.cache = cache;
        this.GAS_KEY = (chainId) => `gasPrice-${chainId}`;
    }
    async getGasPrice() {
        const cachedGasPrice = await this.cache.get(this.GAS_KEY(this.chainId));
        if (cachedGasPrice) {
            log_1.log.info({ cachedGasPrice }, `Got gas station price from local cache: ${cachedGasPrice.gasPriceWei}.`);
            return cachedGasPrice;
        }
        log_1.log.info('Gas station price local cache miss.');
        const gasPrice = await this.gasPriceProvider.getGasPrice();
        await this.cache.set(this.GAS_KEY(this.chainId), gasPrice);
        return gasPrice;
    }
}
exports.CachingGasStationProvider = CachingGasStationProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGluZy1nYXMtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvcHJvdmlkZXJzL2NhY2hpbmctZ2FzLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHFDQUFrQztBQUlsQzs7Ozs7R0FLRztBQUNILE1BQWEseUJBQXlCO0lBR3BDOzs7OztPQUtHO0lBQ0gsWUFDWSxPQUFnQixFQUNsQixnQkFBbUMsRUFDbkMsS0FBdUI7UUFGckIsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUNsQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1FBQ25DLFVBQUssR0FBTCxLQUFLLENBQWtCO1FBWHpCLFlBQU8sR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRSxDQUFDLFlBQVksT0FBTyxFQUFFLENBQUM7SUFZM0QsQ0FBQztJQUVHLEtBQUssQ0FBQyxXQUFXO1FBQ3RCLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUV4RSxJQUFJLGNBQWMsRUFBRTtZQUNsQixTQUFHLENBQUMsSUFBSSxDQUNOLEVBQUUsY0FBYyxFQUFFLEVBQ2xCLDJDQUEyQyxjQUFjLENBQUMsV0FBVyxHQUFHLENBQ3pFLENBQUM7WUFFRixPQUFPLGNBQWMsQ0FBQztTQUN2QjtRQUVELFNBQUcsQ0FBQyxJQUFJLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUNoRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMzRCxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRTNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7Q0FDRjtBQWpDRCw4REFpQ0MifQ==