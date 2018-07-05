import { PriorityQueue } from 'typescript-collections';
import { Order } from './order';

export type QueueSortFunction = (a: Order, b: Order) => number;

const sortBuys: QueueSortFunction = (a, b) => (a.price > b.price ? 1 : -1);
const sortSells: QueueSortFunction = (a, b) => (a.price < b.price ? 1 : -1);

export const createBuyQueue: () => PriorityQueue<Order> = () => new PriorityQueue<Order>(sortBuys);
export const createSellQueue: () => PriorityQueue<Order> = () => new PriorityQueue<Order>(sortSells);
