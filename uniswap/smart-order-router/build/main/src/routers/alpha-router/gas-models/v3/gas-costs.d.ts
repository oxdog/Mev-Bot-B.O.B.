import { BigNumber } from '@ethersproject/bignumber';
import { ChainId } from '../../../..';
export declare const BASE_SWAP_COST: (id: ChainId) => BigNumber;
export declare const COST_PER_INIT_TICK: (id: ChainId) => BigNumber;
export declare const COST_PER_HOP: (id: ChainId) => BigNumber;
