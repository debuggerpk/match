import { PriorityQueue, BSTreeKV } from 'typescript-collections';
import { Order } from './order';

interface ILoopFunction<T> {
  (a: T): boolean | void;
}
interface CreatedTimeStamped {
  createdAt: Date;
}

interface Priced {
  price: number;
}

export type QueueSortFunction = (a: any, b: any) => number;

const sortByCreateDate: QueueSortFunction = (a, b) => (a.updatedAt < b.updatedAt ? 1 : -1);
const sortByPrice: QueueSortFunction = (a, b) => (a.price < b.price ? 1 : -1);

export class BuyQueue {
  private byPrice = new BSTreeKV<Priced, Order>(sortByPrice);
  private byDate = new BSTreeKV<CreatedTimeStamped, Order>(sortByCreateDate);

  public minByPrice() {
    return this.byPrice.minimum();
  }

  public maxByPrice() {
    return this.byPrice.maximum();
  }

  public minByDate() {
    return this.byDate.minimum();
  }

  public maxByDate() {
    return this.byDate.maximum();
  }

  public searchByPrice(price: number) {
    return this.byPrice.search({ price });
  }

  public searchByDate(createdAt: Date) {
    return this.byDate.search({ createdAt });
  }

  public iterateByDate(callback: ILoopFunction<Order>) {
    return this.byPrice.forEach(callback);
  }

  public add(order: Order) {
    this.byDate.add(order);
    this.byPrice.add(order);
  }

  public size() {
    this.byPrice.size();
  }

  public isEmpty() {
    return this.byDate.isEmpty();
  }

  public remove(order: Order) {
    const { price, createdAt } = order;
    this.byDate.remove({ createdAt });
    this.byPrice.remove({ price });
  }
}

export const createSellQueue: () => PriorityQueue<Order> = () => new PriorityQueue<Order>(sortByPrice);
