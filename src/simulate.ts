import * as Amqp from 'amqp-ts';
import { interval, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Exchange, OrderMatch } from './lib/exchange';
import { generateRandomOrder, Order } from './lib/order';
import { createBuyQueue, createSellQueue } from './lib/queues';

const simplex = new Exchange(createBuyQueue(), createSellQueue());

// interval(0.001)
//   .pipe(
//     map(generateRandomOrder),
//     map(order => exchange.match(order)),
//   )
//   .subscribe();

const orderReciever$: ReplaySubject<Order> = new ReplaySubject<Order>();
const matchReciver$: ReplaySubject<Array<OrderMatch>> = new ReplaySubject<Array<OrderMatch>>();

const connection = new Amqp.Connection('amqp://rabbitmq:rabbitmq@localhost');
const exchange = connection.declareExchange('simplex');
const orderQueue = connection.declareQueue('orders');
const matchQueue = connection.declareQueue('matches');

orderQueue.bind(exchange);
matchQueue.bind(exchange);

orderQueue.startConsumer(msg => orderReciever$.next(msg));
matchQueue.startConsumer(msg => matchReciver$.next(msg));

/**
 * Functions to perform when the message is recieved on appropriate queue
 */

const sendToOrderQueue: (order: Order) => void = order => {
  orderQueue.send(new Amqp.Message(order));
};

const sendToMatchQueue: (matches: Array<OrderMatch>) => void = matches => {
  matchQueue.send(new Amqp.Message(matches));
};

/**
 * Simulating order generation and sending it to exchange
 */
connection.completeConfiguration().then(() => {
  interval(0.5)
    .pipe(
      map(generateRandomOrder),
      tap(sendToOrderQueue),
    )
    .subscribe();
});

/**
 * Subscribing to reciever, to get from the queue and then simpulate exchange
 */
orderReciever$
  .pipe(
    map(order => simplex.match(order)),
    tap(sendToMatchQueue),
  )
  .subscribe();

matchReciver$.pipe(tap(console.log)).subscribe();
