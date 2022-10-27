"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapRouterProvider = void 0;
const SwapRouter02__factory_1 = require("../types/other/factories/SwapRouter02__factory");
const util_1 = require("../util");
const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
class SwapRouterProvider {
    constructor(multicall2Provider) {
        this.multicall2Provider = multicall2Provider;
    }
    async getApprovalType(tokenInAmount, tokenOutAmount) {
        var _a, _b;
        const functionParams = [
            [
                tokenInAmount.currency.wrapped.address,
                tokenInAmount.quotient.toString(),
            ],
            [
                tokenOutAmount.currency.wrapped.address,
                tokenOutAmount.quotient.toString(),
            ],
        ];
        const tx = await this.multicall2Provider.callSameFunctionOnContractWithMultipleParams({
            address: SWAP_ROUTER_ADDRESS,
            contractInterface: SwapRouter02__factory_1.SwapRouter02__factory.createInterface(),
            functionName: 'getApprovalType',
            functionParams,
        });
        if (!((_a = tx.results[0]) === null || _a === void 0 ? void 0 : _a.success) || !((_b = tx.results[1]) === null || _b === void 0 ? void 0 : _b.success)) {
            util_1.log.info({ results: tx.results }, 'Failed to get approval type from swap router for token in or token out');
            throw new Error('Failed to get approval type from swap router for token in or token out');
        }
        const { result: approvalTokenIn } = tx.results[0];
        const { result: approvalTokenOut } = tx.results[1];
        return {
            approvalTokenIn: approvalTokenIn[0],
            approvalTokenOut: approvalTokenOut[0],
        };
    }
}
exports.SwapRouterProvider = SwapRouterProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dhcC1yb3V0ZXItcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvcHJvdmlkZXJzL3N3YXAtcm91dGVyLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLDBGQUF1RjtBQUN2RixrQ0FBOEI7QUFROUIsTUFBTSxtQkFBbUIsR0FBRyw0Q0FBNEMsQ0FBQztBQXNCekUsTUFBYSxrQkFBa0I7SUFDN0IsWUFBc0Isa0JBQXNDO1FBQXRDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7SUFBRyxDQUFDO0lBRXpELEtBQUssQ0FBQyxlQUFlLENBQzFCLGFBQXVDLEVBQ3ZDLGNBQXdDOztRQUV4QyxNQUFNLGNBQWMsR0FBdUI7WUFDekM7Z0JBQ0UsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTztnQkFDdEMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7YUFDbEM7WUFDRDtnQkFDRSxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPO2dCQUN2QyxjQUFjLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTthQUNuQztTQUNGLENBQUM7UUFFRixNQUFNLEVBQUUsR0FDTixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyw0Q0FBNEMsQ0FHeEU7WUFDQSxPQUFPLEVBQUUsbUJBQW1CO1lBQzVCLGlCQUFpQixFQUFFLDZDQUFxQixDQUFDLGVBQWUsRUFBRTtZQUMxRCxZQUFZLEVBQUUsaUJBQWlCO1lBQy9CLGNBQWM7U0FDZixDQUFDLENBQUM7UUFFTCxJQUFJLENBQUMsQ0FBQSxNQUFBLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLDBDQUFFLE9BQU8sQ0FBQSxJQUFJLENBQUMsQ0FBQSxNQUFBLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLDBDQUFFLE9BQU8sQ0FBQSxFQUFFO1lBQ3RELFVBQUcsQ0FBQyxJQUFJLENBQ04sRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUN2Qix3RUFBd0UsQ0FDekUsQ0FBQztZQUNGLE1BQU0sSUFBSSxLQUFLLENBQ2Isd0VBQXdFLENBQ3pFLENBQUM7U0FDSDtRQUVELE1BQU0sRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwRCxPQUFPO1lBQ0wsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDbkMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1NBQ3RDLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUEvQ0QsZ0RBK0NDIn0=