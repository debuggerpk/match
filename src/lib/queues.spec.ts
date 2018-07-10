import ava from 'ava';
import { PriorityQueue } from 'typescript-collections';
import { Order, OrderType } from './order';
import { BuyQueue, createSellQueue } from './queues';
import { interval } from '../../node_modules/rxjs';
import { take } from '../../node_modules/rxjs/operators';

ava.beforeEach(test => {
  test.context['sellQueue'] = createSellQueue();
  test.context['buyQueue'] = new BuyQueue();
});

ava('Sell Queue: Creation Successfull', test => {
  const queue: PriorityQueue<Order> = test.context['sellQueue'];
  test.is(queue.isEmpty(), true);
});

ava('Sell Queue: Addition Succesfull', test => {
  const queue: PriorityQueue<Order> = test.context['sellQueue'];
  queue.add(new Order(100, 100, OrderType.SELL));

  test.is(queue.isEmpty(), false);
  test.is(queue.size(), 1);
});

ava('Sell Queue: Priority Queuing Succesful', test => {
  const queue: PriorityQueue<Order> = test.context['sellQueue'];

  queue.add(new Order(150, 100, OrderType.SELL));
  queue.add(new Order(100, 100, OrderType.SELL));
  queue.add(new Order(175, 100, OrderType.SELL));

  test.is(queue.isEmpty(), false);
  test.is(queue.size(), 3);

  const topOrder = <Order>queue.peek();

  test.is(topOrder.price, 100);
});

ava('Buy Queue: Creation Successfull', test => {
  const queue: BuyQueue = test.context['buyQueue'];
  test.is(queue.isEmpty(), true);
});

ava('Buy Queue: Addition Successfull', test => {
  const queue: BuyQueue = test.context['buyQueue'];
  queue.add(new Order(100, 100, OrderType.BUY));

  test.is(queue.isEmpty(), false);
  test.is(queue.size(), 1);
});

// ava('Buy Queue: Priority Queuing Succesful', async t => {
//   const clock = t.clock();
//   const queue: BuyQueue = t.context['buyQueue'];

//   const orders = [
//     () => new Order(150, 100, OrderType.BUY),
//     () => new Order(100, 100, OrderType.BUY),
//     () => new Order(175, 100, OrderType.BUY),
//     () => new Order(125, 100, OrderType.BUY),
//   ];

//   orders.forEach(order => setTimeout(() => queue.add(order()), 10));

//   await clock.time(100);

//   t.is(queue.size(), 4);
// });
