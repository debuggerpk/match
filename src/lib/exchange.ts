import cuid from 'cuid';
import { ReplaySubject } from 'rxjs';
import { PriorityQueue } from 'typescript-collections';
import { Order, OrderType } from './order';
import { BuyQueue, createSellQueue } from './queues';

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
  private buyQueue: BuyQueue = new BuyQueue();
  private sellQueue: PriorityQueue<Order> = createSellQueue();

  /**
   * The actual exchange will be a stream computing problem, and we don't want to miss anything in the stream.
   * The results of the streams can be scubscribed and then put into the databse. or destroyed :)
   *
   * @public
   * @type {ReplaySubject<Array<OrderMatch>>}
   * @memberof Exchange
   */
  public matchStream$: ReplaySubject<OrderMatch> = new ReplaySubject();

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
   * Performance. Its literally at the top the queue! no brainer
   *
   *
   * @private
   * @param {Order} buyOrder
   * @param {Array<OrderMatch>} matches
   * @returns {Array<OrderMatch>}
   * @memberof Exchange
   */
  private matchBuys(buyOrder: Order): void {
    if (this.sellQueue.isEmpty()) {
      this.buyQueue.add(buyOrder);
    }

    // the loop might not be effecient, but javascript build in concurrency takes the cake.
    while (!this.sellQueue.isEmpty()) {
      let sellOrder = <Order>this.sellQueue.dequeue();

      if (buyOrder.price >= sellOrder.price) {
        if (buyOrder.quantity < sellOrder.quantity) {
          // Push the match to Match Stream
          this.matchStream$.next(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, buyOrder.quantity));

          sellOrder = {
            ...sellOrder,
            quantity: sellOrder.quantity - buyOrder.quantity,
            updatedAt: new Date(),
          };
          this.sellQueue.add(sellOrder);
          break;
        } else {
          // Push the match into Match Stream
          this.matchStream$.next(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, sellOrder.quantity));

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
  }

  /**
   *
   * Matches the single sell order against the buy orders priority queue.
   *
   * This one is tricky. The Buy Queue is FIFO, so we create a seprate strcuture BuyQueue, which holds two BST
   * (Binary Search Trees) in parallel. We find the minimums from buyQueue tree arranged by price, at each iteration.
   * We use javascripts native concurrency, we push into the match stream as soon as the match is found, and
   * our loop keeps on running. WIN.
   *
   * @private
   * @param {Order} sellOrder
   * @returns {Array<OrderMatch>}
   * @memberof Exchange
   */
  private matchSells(sellOrder: Order): void {
    if (this.buyQueue.isEmpty()) {
      this.sellQueue.add(sellOrder);
      return;
    }

    let minBuyOrder = <Order>this.buyQueue.minByPrice();

    if (minBuyOrder.price > sellOrder.price) {
      this.buyQueue.iterateByDate(buyOrder => {
        if (buyOrder.price >= sellOrder.price) {
          if (sellOrder.quantity > buyOrder.quantity) {
            this.matchStream$.next(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, buyOrder.quantity));

            // Since the buy order gets exhauseted, we remove it from buy order queue, and then update the sell order.
            this.buyQueue.remove(buyOrder);

            // Updating the sell order

            sellOrder = { ...sellOrder, quantity: sellOrder.quantity - buyOrder.quantity, updatedAt: new Date() };

            // Now to break the loop or not
            // if the minimum buy order is still greater than current sell price, we break the loop here, else we
            // keep on iterating
            minBuyOrder = <Order>this.buyQueue.minByPrice();
            if (this.buyQueue.isEmpty() || (minBuyOrder && minBuyOrder.price < sellOrder.price)) {
              return false;
            }
          } else {
            this.matchStream$.next(new OrderMatch(buyOrder.id, sellOrder.id, sellOrder.price, sellOrder.quantity));
            this.buyQueue.remove(buyOrder);

            // we break the loop here if the quantities match since sell order gets exhaused buy we still need to go
            // back and back the remaining buy order into buy queue
            if (buyOrder.quantity === sellOrder.quantity) {
              return false;
            }

            // adding the remaining order back, and breaking the order
            this.buyQueue.add({ ...buyOrder, quantity: buyOrder.quantity - sellOrder.quantity, updatedAt: new Date() });
            return false;
          }
        }
      });
    }
  }

  /**
   * Split the orders into two streams depending upon the conditions.
   *
   * @param {Order} order
   * @returns {Array<OrderMatch>}
   * @memberof Exchange
   */
  public doMatch(order: Order): void {
    order.type === OrderType.BUY ? this.matchBuys(order) : this.matchSells(order);
  }
}
