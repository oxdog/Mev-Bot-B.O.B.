"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachingTokenListProvider = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
const axios_1 = __importDefault(require("axios"));
const lodash_1 = __importDefault(require("lodash"));
const log_1 = require("../util/log");
const metric_1 = require("../util/metric");
class CachingTokenListProvider {
    /**
     * Creates an instance of CachingTokenListProvider.
     * Token metadata (e.g. symbol and decimals) generally don't change so can be cached indefinitely.
     *
     * @param chainId The chain id to use.
     * @param tokenList The token list to get the tokens from.
     * @param tokenCache Cache instance to hold cached tokens.
     */
    constructor(chainId, tokenList, tokenCache) {
        this.tokenCache = tokenCache;
        this.CACHE_KEY = (tokenInfo) => `token-list-token-${this.chainId}/${this.tokenList.name}/${this.tokenList.timestamp}/${this.tokenList.version}/${tokenInfo.address.toLowerCase()}/${tokenInfo.decimals}/${tokenInfo.symbol}/${tokenInfo.name}`;
        this.chainId = chainId;
        this.tokenList = tokenList;
        this.chainToTokenInfos = lodash_1.default.reduce(this.tokenList.tokens, (result, tokenInfo) => {
            const chainId = tokenInfo.chainId.toString();
            if (!result[chainId]) {
                result[chainId] = [];
            }
            result[chainId].push(tokenInfo);
            return result;
        }, {});
        this.chainSymbolToTokenInfo = lodash_1.default.mapValues(this.chainToTokenInfos, (tokenInfos) => lodash_1.default.keyBy(tokenInfos, 'symbol'));
        this.chainAddressToTokenInfo = lodash_1.default.mapValues(this.chainToTokenInfos, (tokenInfos) => lodash_1.default.keyBy(tokenInfos, (tokenInfo) => tokenInfo.address.toLowerCase()));
    }
    static async fromTokenListURI(chainId, tokenListURI, tokenCache) {
        const now = Date.now();
        const tokenList = await this.buildTokenList(tokenListURI);
        metric_1.metric.putMetric('TokenListLoad', Date.now() - now, metric_1.MetricLoggerUnit.Milliseconds);
        return new CachingTokenListProvider(chainId, tokenList, tokenCache);
    }
    static async buildTokenList(tokenListURI) {
        log_1.log.info(`Getting tokenList from ${tokenListURI}.`);
        const response = await axios_1.default.get(tokenListURI);
        log_1.log.info(`Got tokenList from ${tokenListURI}.`);
        const { data: tokenList, status } = response;
        if (status != 200) {
            log_1.log.error({ response }, `Unabled to get token list from ${tokenListURI}.`);
            throw new Error(`Unable to get token list from ${tokenListURI}`);
        }
        return tokenList;
    }
    static async fromTokenList(chainId, tokenList, tokenCache) {
        const now = Date.now();
        const tokenProvider = new CachingTokenListProvider(chainId, tokenList, tokenCache);
        metric_1.metric.putMetric('TokenListLoad', Date.now() - now, metric_1.MetricLoggerUnit.Milliseconds);
        return tokenProvider;
    }
    async getTokens(_addresses) {
        const addressToToken = {};
        const symbolToToken = {};
        for (const address of _addresses) {
            const token = await this.getTokenByAddress(address);
            if (!token) {
                continue;
            }
            addressToToken[address.toLowerCase()] = token;
            if (!token.symbol) {
                continue;
            }
            symbolToToken[token.symbol.toLowerCase()] = token;
        }
        return {
            getTokenByAddress: (address) => addressToToken[address.toLowerCase()],
            getTokenBySymbol: (symbol) => symbolToToken[symbol.toLowerCase()],
            getAllTokens: () => {
                return Object.values(addressToToken);
            },
        };
    }
    async getTokenBySymbol(_symbol) {
        let symbol = _symbol;
        // We consider ETH as a regular ERC20 Token throughout this package. We don't use the NativeCurrency object from the sdk.
        // When we build the calldata for swapping we insert wrapping/unwrapping as needed.
        if (_symbol == 'ETH') {
            symbol = 'WETH';
        }
        if (!this.chainSymbolToTokenInfo[this.chainId.toString()]) {
            return undefined;
        }
        const tokenInfo = this.chainSymbolToTokenInfo[this.chainId.toString()][symbol];
        if (!tokenInfo) {
            return undefined;
        }
        const token = await this.buildToken(tokenInfo);
        return token;
    }
    async getTokenByAddress(address) {
        if (!this.chainAddressToTokenInfo[this.chainId.toString()]) {
            return undefined;
        }
        const tokenInfo = this.chainAddressToTokenInfo[this.chainId.toString()][address.toLowerCase()];
        if (!tokenInfo) {
            return undefined;
        }
        const token = await this.buildToken(tokenInfo);
        return token;
    }
    async buildToken(tokenInfo) {
        const cacheKey = this.CACHE_KEY(tokenInfo);
        const cachedToken = await this.tokenCache.get(cacheKey);
        if (cachedToken) {
            return cachedToken;
        }
        const token = new sdk_core_1.Token(this.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name);
        await this.tokenCache.set(cacheKey, token);
        return token;
    }
}
exports.CachingTokenListProvider = CachingTokenListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGluZy10b2tlbi1saXN0LXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3Byb3ZpZGVycy9jYWNoaW5nLXRva2VuLWxpc3QtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsZ0RBQTBDO0FBRTFDLGtEQUEwQjtBQUMxQixvREFBdUI7QUFFdkIscUNBQWtDO0FBQ2xDLDJDQUEwRDtBQXFCMUQsTUFBYSx3QkFBd0I7SUFnQm5DOzs7Ozs7O09BT0c7SUFDSCxZQUNFLE9BQXlCLEVBQ3pCLFNBQW9CLEVBQ1osVUFBeUI7UUFBekIsZUFBVSxHQUFWLFVBQVUsQ0FBZTtRQXhCM0IsY0FBUyxHQUFHLENBQUMsU0FBb0IsRUFBRSxFQUFFLENBQzNDLG9CQUFvQixJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQ2pCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFDM0QsU0FBUyxDQUFDLFFBQ1osSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQXFCekMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFFM0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGdCQUFDLENBQUMsTUFBTSxDQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFDckIsQ0FBQyxNQUE0QixFQUFFLFNBQW9CLEVBQUUsRUFBRTtZQUNyRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxP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