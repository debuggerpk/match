import ava from 'ava';
import { Order, OrderType } from './order';
import { createBuyQueue, createSellQueue } from './queues';
import { PriorityQueue } from 'typescript-collections';

ava.beforeEach(test => {
  test.context['buyQueue'] = createBuyQueue();
  test.context['sellQueue'] = createSellQueue();
});

ava('Buy Queue: Creation Successfull', test => {
  const queue = <PriorityQueue<Order>>test.context['buyQueue'];
  test.is(queue.isEmpty(), true);
});

ava('Buy Queue: Addition Succesfull', test => {
  const queue = <PriorityQueue<Order>>test.context['buyQueue'];
  queue.add(new Order(100, 100, OrderType.BUY));

  test.is(queue.isEmpty(), false);
  test.is(queue.size(), 1);
});

ava('Buy Queue: Priority Queuing Succesful', test => {
  const queue = <PriorityQueue<Order>>test.context['buyQueue'];

  queue.add(new Order(100, 100, OrderType.BUY));
  queue.add(new Order(200, 100, OrderType.BUY));
  queue.add(new Order(150, 100, OrderType.BUY));

  test.is(queue.isEmpty(), false);
  test.is(queue.size(), 3);

  const topOrder = <Order>queue.peek();

  test.is(topOrder.price, 200);
});

ava('Sell Queue: Creation Successfull', test => {
  const queue = <PriorityQueue<Order>>test.context['sellQueue'];
  test.is(queue.isEmpty(), true);
});

ava('Sell Queue: Addition Succesfull', test => {
  const queue = <PriorityQueue<Order>>test.context['sellQueue'];
  queue.add(new Order(100, 100, OrderType.SELL));

  test.is(queue.isEmpty(), false);
  test.is(queue.size(), 1);
});

ava('Sell Queue: Priority Queuing Succesful', test => {
  const queue = <PriorityQueue<Order>>test.context['sellQueue'];

  queue.add(new Order(150, 100, OrderType.SELL));
  queue.add(new Order(100, 100, OrderType.SELL));
  queue.add(new Order(175, 100, OrderType.SELL));

  test.is(queue.isEmpty(), false);
  test.is(queue.size(), 3);

  const topOrder = <Order>queue.peek();

  test.is(topOrder.price, 100);
});
