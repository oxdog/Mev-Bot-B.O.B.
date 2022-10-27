"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISwapToRatio = exports.IRouter = exports.SwapToRatioStatus = exports.V2Route = exports.V3Route = void 0;
const v2_sdk_1 = require("@uniswap/v2-sdk");
const v3_sdk_1 = require("@uniswap/v3-sdk");
class V3Route extends v3_sdk_1.Route {
}
exports.V3Route = V3Route;
class V2Route extends v2_sdk_1.Route {
}
exports.V2Route = V2Route;
var SwapToRatioStatus;
(function (SwapToRatioStatus) {
    SwapToRatioStatus[SwapToRatioStatus["SUCCESS"] = 1] = "SUCCESS";
    SwapToRatioStatus[SwapToRatioStatus["NO_ROUTE_FOUND"] = 2] = "NO_ROUTE_FOUND";
    SwapToRatioStatus[SwapToRatioStatus["NO_SWAP_NEEDED"] = 3] = "NO_SWAP_NEEDED";
})(SwapToRatioStatus = exports.SwapToRatioStatus || (exports.SwapToRatioStatus = {}));
/**
 * Provides functionality for finding optimal swap routes on the Uniswap protocol.
 *
 * @export
 * @abstract
 * @class IRouter
 */
class IRouter {
}
exports.IRouter = IRouter;
class ISwapToRatio {
}
exports.ISwapToRatio = ISwapToRatio;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3JvdXRlcnMvcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVNBLDRDQUFzRDtBQUN0RCw0Q0FLeUI7QUFJekIsTUFBYSxPQUFRLFNBQVEsY0FBd0I7Q0FBRztBQUF4RCwwQkFBd0Q7QUFDeEQsTUFBYSxPQUFRLFNBQVEsY0FBd0I7Q0FBRztBQUF4RCwwQkFBd0Q7QUF1RHhELElBQVksaUJBSVg7QUFKRCxXQUFZLGlCQUFpQjtJQUMzQiwrREFBVyxDQUFBO0lBQ1gsNkVBQWtCLENBQUE7SUFDbEIsNkVBQWtCLENBQUE7QUFDcEIsQ0FBQyxFQUpXLGlCQUFpQixHQUFqQix5QkFBaUIsS0FBakIseUJBQWlCLFFBSTVCO0FBa0VEOzs7Ozs7R0FNRztBQUNILE1BQXNCLE9BQU87Q0FvQjVCO0FBcEJELDBCQW9CQztBQUVELE1BQXNCLFlBQVk7Q0FTakM7QUFURCxvQ0FTQyJ9