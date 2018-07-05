import cuid from 'cuid';
import { ReplaySubject } from 'rxjs';
import { PriorityQueue } from 'typescript-collections';
import { Order, OrderType } from './order';

/**
 * Defines the match once an order has been matched
 *
 * @export
 * @class OrderMatch
 */
export class OrderMatch {
  public id: string = cuid();
  public buyOrder: string;
  public sellOrder: string;
  public price: number;
  public quantity: number;
  public createdAt: Date = new Date();
  public updatedAt: Date = new Date();

  /**
   * Creates match given we have
   *
   * @param {string} buyOrder
   * @param {string} sellOrder
   * @param {number} price
   * @param {number} quantity
   * @memberof OrderMatch
   */
  constructor(buyOrder: string, sellOrder: string, price: number, quantity: number) {
    this.buyOrder = buyOrder;
    this.sellOrder = sellOrder;
    this.price = price;
    this.quantity = quantity;
  }
}

/**
 * Creates an in memory exchange.
 *
 * We divide the order book into two priority queues.
 *
 * Priority Queues (an implementation of Binary Heap) was chosed over Binary Heap and Binary Search Tree
 * for a couple of reasons.
 *
 * 1. Since Binary Heap is implemented using arrays, there is always better locality of
 *    reference and operations are more cache friendly.
 * 2. We can build a Binary Heap in O(n) time. Self Balancing Binary Search Trees require O(nLogn) time to construct.
 * 3. Easier on the caches, meaning more effecient for long queues.
 * 4. Binary Heap doesn’t require extra space for pointers.
 *
 * These priority queues will actually be streams in a live production system. In node js world, RxJs makes life very
 * easy working with streams.
 *
 * @export
 * @class Exchange
 */
export class Exchange {
  private buyQueue!: PriorityQueue<Order>;
  private sellQueue!: PriorityQueue<Order>;

  /**
   * The actual exchange will be a stream computing problem, and we don't want to miss anything in the stream.
   * The results of the streams can be scubscribed and then put into the databse.
   *
   * @private
   * @type {ReplaySubject<Array<OrderMatch>>}
   * @memberof Exchange
   */
  private matches: ReplaySubject<Array<OrderMatch>> = new ReplaySubject();

  /**
   *
   * Matches the single buy against the sell orders priority queue.
   *
   * When buying we iterate over each item of the sell prioirity queue using a while loop.
   *
   * If the sell queue is empty, we simply push the buy order into buy priority queue.
   *
   * The exit conditions of while loop are
   *
   *    1. We reach the end of the queue
   *    2. The buy price is less then the sell price of
   *       the top most item. (Since the sell priority queue is arranged with least sell price on top)
   *    3. The buy order gets exhausted.
   *
   *
   * @private
   * @param {Order} buyOrder
   * @param {Array<OrderMatch>} matches
   * @returns {Array<OrderMatch>}
   * @memberof Exchange
   */
  private matchBuys(buyOrder: Order): Array<OrderMatch> {
    // tslint:disable-next-line:prefer-array-literal
    const matches: Array<OrderMatch> = [];

    if (this.sellQueue.isEmpty()) {
      this.buyQueue.add(buyOrder);
      return matches;
    }

    while (!this.sellQueue.isEmpty()) {
      let sellOrder = <Order>this.sellQueue.dequeue();

      if (buyOrder.price >= sellOrder.price) {
        if (buyOrder.quantity < sellOrder.quantity) {
          matches.push(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, buyOrder.quantity));
          sellOrder = {
            ...sellOrder,
            quantity: sellOrder.quantity - buyOrder.quantity,
            updatedAt: new Date(),
          };
          this.sellQueue.add(sellOrder);
          break;
        } else {
          matches.push(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, sellOrder.quantity));

          if (buyOrder.quantity === sellOrder.quantity) {
            break;
          }

          buyOrder = {
            ...buyOrder,
            quantity: buyOrder.quantity - sellOrder.quantity,
            updatedAt: new Date(),
          };
        }
      } else {
        this.buyQueue.add(buyOrder);
        this.sellQueue.add(sellOrder);
        break;
      }
    }

    return matches;
  }

  /**
   *
   * Matches the single sell order against the buy orders priority queue.
   *
   * When selling we iterate over each item of the buy prioirity queue using a while loop.
   *
   * If the buy queue is empty, we simply push the sell order into sell priority queue.
   *
   * The exit conditions of while loop are
   *
   *    1. We reach the end of the sell priority queue
   *    2. The sell price is greater then the sell price of
   *       the top most item. (Since the buy priority queue is arranged with greatest buy price on top)
   *    3. The sell order queue gets exhausted.
   *
   * @private
   * @param {Order} sellOrder
   * @returns {Array<OrderMatch>}
   * @memberof Exchange
   */
  private matchSells(sellOrder: Order): Array<OrderMatch> {
    // tslint:disable-next-line:prefer-array-literal
    const matches: Array<OrderMatch> = [];
    if (this.buyQueue.isEmpty()) {
      this.sellQueue.add(sellOrder);
      return matches;
    }

    while (!this.buyQueue.isEmpty()) {
      const buyOrder = <Order>this.buyQueue.dequeue();

      if (buyOrder.price >= sellOrder.price) {
        if (buyOrder.quantity <= sellOrder.quantity) {
          matches.push(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, buyOrder.quantity));

          if (buyOrder.quantity === sellOrder.quantity) {
            break;
          }

          sellOrder = {
            ...sellOrder,
            quantity: sellOrder.quantity - buyOrder.quantity,
            updatedAt: new Date(),
          };
        } else {
          matches.push(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, sellOrder.quantity));
          this.buyQueue.add({ ...buyOrder, quantity: buyOrder.quantity - sellOrder.quantity, updatedAt: new Date() });
          break;
        }
      } else {
        this.sellQueue.add(sellOrder);
        this.buyQueue.add(buyOrder);
        break;
      }
    }
    return matches;
  }

  constructor(buyQueue: PriorityQueue<Order>, sellQueue: PriorityQueue<Order>) {
    this.buyQueue = buyQueue;
    this.sellQueue = sellQueue;
  }

  /**
   *
   * First try to match the order against either buyQueue or SellQueue. if no match is found,
   * it adds the order to the queue
   *
   * @param {Order} order
   * @returns {Array<OrderMatch>}
   * @memberof Exchange
   */
  public match(order: Order): Array<OrderMatch> {
    const matches: Array<OrderMatch> = order.type === OrderType.BUY ? this.matchBuys(order) : this.matchSells(order);
    this.matches.next(matches);
    return matches;
  }
}
