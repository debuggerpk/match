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
/**
 * Defines Buy Queue. A constructor that mantains two binary search tree, one to mantain the ordering by date,
 * and the other to maintain the ordering by value.
 *
 * @export
 * @class BuyQueue
 */
export class BuyQueue {
  private byPrice = new BSTreeKV<Priced, Order>(sortByPrice);
  private byDate = new BSTreeKV<CreatedTimeStamped, Order>(sortByCreateDate);

  /**
   * Search the BST to get minimum by price.
   *
   * @returns {(Order | undefined)}
   * @memberof BuyQueue
   */
  public minByPrice(): Order | undefined {
    return this.byPrice.minimum();
  }

  /**
   * Search the BST to get maximum by price
   *
   * @returns {(Order | undefined)}
   * @memberof BuyQueue
   */
  public maxByPrice(): Order | undefined {
    return this.byPrice.maximum();
  }

  /**
   * Search the BST to get minimum by Date
   *
   * @returns {(Order | undefined)}
   * @memberof BuyQueue
   */
  public minByDate(): Order | undefined {
    return this.byDate.minimum();
  }

  /**
   * Search the BST to get maximum by Date
   *
   * @returns {(Order | undefined)}
   * @memberof BuyQueue
   */
  public maxByDate(): Order | undefined {
    return this.byDate.maximum();
  }

  /**
   * Search by price, gets the Order if we are given a price
   *
   * @param {number} price
   * @returns {(Order | undefined)}
   * @memberof BuyQueue
   */
  public searchByPrice(price: number): Order | undefined {
    return this.byPrice.search({ price });
  }

  /**
   * If we know the creation date, search by creation date
   *
   * @param {Date} createdAt
   * @returns {(Order | undefined)}
   * @memberof BuyQueue
   */
  public searchByDate(createdAt: Date): Order | undefined {
    return this.byDate.search({ createdAt });
  }

  /**
   * Applies the given function on each node of the tree
   *
   * @param {ILoopFunction<Order>} callback
   * @returns {void}
   * @memberof BuyQueue
   */
  public iterateByDate(callback: ILoopFunction<Order>): void {
    return this.byPrice.forEach(callback);
  }

  /**
   * Adds an item in the tree
   *
   * @param {Order} order
   * @memberof BuyQueue
   */
  public add(order: Order): void {
    this.byDate.add(order);
    this.byPrice.add(order);
  }

  /**
   * Gets the size of the BST
   *
   * @returns {number}
   * @memberof BuyQueue
   */
  public size(): number {
    return this.byPrice.size();
  }

  /**
   * Gets true if the tree is empty, else false
   *
   * @returns {boolean}
   * @memberof BuyQueue
   */
  public isEmpty(): boolean {
    return this.byDate.isEmpty();
  }

  /**
   * Remove the node from both BSTs, the one ordered by date, and the other ordered by price
   *
   * @param {Order} order
   * @memberof BuyQueue
   */
  public remove(order: Order) {
    const { price, createdAt } = order;
    this.byDate.remove({ createdAt });
    this.byPrice.remove({ price });
  }
}

export const createSellQueue: () => PriorityQueue<Order> = () => new PriorityQueue<Order>(sortByPrice);
