"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyGasPriceProvider = void 0;
const util_1 = require("../util");
const gas_price_provider_1 = require("./gas-price-provider");
class LegacyGasPriceProvider extends gas_price_provider_1.IGasPriceProvider {
    constructor(provider) {
        super();
        this.provider = provider;
    }
    async getGasPrice() {
        const gasPriceWei = await this.provider.getGasPrice();
        util_1.log.info({ gasPriceWei }, `Got gas price ${gasPriceWei} using eth_gasPrice RPC`);
        return {
            gasPriceWei,
        };
    }
}
exports.LegacyGasPriceProvider = LegacyGasPriceProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVnYWN5LWdhcy1wcmljZS1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9wcm92aWRlcnMvbGVnYWN5LWdhcy1wcmljZS1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxrQ0FBOEI7QUFDOUIsNkRBQW1FO0FBRW5FLE1BQWEsc0JBQXVCLFNBQVEsc0NBQWlCO0lBQzNELFlBQXNCLFFBQXlCO1FBQzdDLEtBQUssRUFBRSxDQUFDO1FBRFksYUFBUSxHQUFSLFFBQVEsQ0FBaUI7SUFFL0MsQ0FBQztJQUVNLEtBQUssQ0FBQyxXQUFXO1FBQ3RCLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN0RCxVQUFHLENBQUMsSUFBSSxDQUNOLEVBQUUsV0FBVyxFQUFFLEVBQ2YsaUJBQWlCLFdBQVcseUJBQXlCLENBQ3RELENBQUM7UUFFRixPQUFPO1lBQ0wsV0FBVztTQUNaLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFoQkQsd0RBZ0JDIn0=