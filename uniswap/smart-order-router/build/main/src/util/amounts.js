"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unparseFeeAmount = exports.parseFeeAmount = exports.parseAmount = exports.CurrencyAmount = void 0;
const units_1 = require("@ethersproject/units");
const sdk_core_1 = require("@uniswap/sdk-core");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
class CurrencyAmount extends sdk_core_1.CurrencyAmount {
}
exports.CurrencyAmount = CurrencyAmount;
// Try to parse a user entered amount for a given token
function parseAmount(value, currency) {
    const typedValueParsed = units_1.parseUnits(value, currency.decimals).toString();
    return CurrencyAmount.fromRawAmount(currency, jsbi_1.default.BigInt(typedValueParsed));
}
exports.parseAmount = parseAmount;
function parseFeeAmount(feeAmountStr) {
    switch (feeAmountStr) {
        case '10000':
            return v3_sdk_1.FeeAmount.HIGH;
        case '3000':
            return v3_sdk_1.FeeAmount.MEDIUM;
        case '500':
            return v3_sdk_1.FeeAmount.LOW;
        case '100':
            return v3_sdk_1.FeeAmount.LOWEST;
        default:
            throw new Error(`Fee amount ${feeAmountStr} not supported.`);
    }
}
exports.parseFeeAmount = parseFeeAmount;
function unparseFeeAmount(feeAmount) {
    switch (feeAmount) {
        case v3_sdk_1.FeeAmount.HIGH:
            return '10000';
        case v3_sdk_1.FeeAmount.MEDIUM:
            return '3000';
        case v3_sdk_1.FeeAmount.LOW:
            return '500';
        case v3_sdk_1.FeeAmount.LOWEST:
            return '100';
        default:
            throw new Error(`Fee amount ${feeAmount} not supported.`);
    }
}
exports.unparseFeeAmount = unparseFeeAmount;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1vdW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy91dGlsL2Ftb3VudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsZ0RBQWtEO0FBQ2xELGdEQUcyQjtBQUMzQiw0Q0FBNEM7QUFDNUMsZ0RBQXdCO0FBRXhCLE1BQWEsY0FBZSxTQUFRLHlCQUEyQjtDQUFHO0FBQWxFLHdDQUFrRTtBQUVsRSx1REFBdUQ7QUFDdkQsU0FBZ0IsV0FBVyxDQUFDLEtBQWEsRUFBRSxRQUFrQjtJQUMzRCxNQUFNLGdCQUFnQixHQUFHLGtCQUFVLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN6RSxPQUFPLGNBQWMsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLGNBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0FBQy9FLENBQUM7QUFIRCxrQ0FHQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxZQUFvQjtJQUNqRCxRQUFRLFlBQVksRUFBRTtRQUNwQixLQUFLLE9BQU87WUFDVixPQUFPLGtCQUFTLENBQUMsSUFBSSxDQUFDO1FBQ3hCLEtBQUssTUFBTTtZQUNULE9BQU8sa0JBQVMsQ0FBQyxNQUFNLENBQUM7UUFDMUIsS0FBSyxLQUFLO1lBQ1IsT0FBTyxrQkFBUyxDQUFDLEdBQUcsQ0FBQztRQUN2QixLQUFLLEtBQUs7WUFDUixPQUFPLGtCQUFTLENBQUMsTUFBTSxDQUFDO1FBQzFCO1lBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLFlBQVksaUJBQWlCLENBQUMsQ0FBQztLQUNoRTtBQUNILENBQUM7QUFiRCx3Q0FhQztBQUVELFNBQWdCLGdCQUFnQixDQUFDLFNBQW9CO0lBQ25ELFFBQVEsU0FBUyxFQUFFO1FBQ2pCLEtBQUssa0JBQVMsQ0FBQyxJQUFJO1lBQ2pCLE9BQU8sT0FBTyxDQUFDO1FBQ2pCLEtBQUssa0JBQVMsQ0FBQyxNQUFNO1lBQ25CLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLEtBQUssa0JBQVMsQ0FBQyxHQUFHO1lBQ2hCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsS0FBSyxrQkFBUyxDQUFDLE1BQU07WUFDbkIsT0FBTyxLQUFLLENBQUM7UUFDZjtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxTQUFTLGlCQUFpQixDQUFDLENBQUM7S0FDN0Q7QUFDSCxDQUFDO0FBYkQsNENBYUMifQ==