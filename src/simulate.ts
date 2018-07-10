import * as Amqp from 'amqp-ts';
import * as firebase from 'firebase-admin';
import { interval, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Exchange, OrderMatch } from './lib/exchange';
import { generateRandomOrder, Order } from './lib/order';

/** Firebase */

const serviceAccount = require('./firebase.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://simplex-e7b03.firebaseio.com',
});

const db = firebase.firestore();

const orderCollection = db.collection('orders');
const matchCollection = db.collection('matches');

const saveOrder: (order: Order) => void = order => {
  orderCollection.doc(order.id).set(order);
};

const saveMatch: (match: OrderMatch) => void = match => {
  matchCollection.doc(match.id).set(match);
};

/** Rabbit MQ */

const simplex = new Exchange();

const orderReciever$: ReplaySubject<Order> = new ReplaySubject<Order>();
const matchReciever$: ReplaySubject<OrderMatch> = new ReplaySubject<OrderMatch>();

const connection = new Amqp.Connection('amqp://rabbitmq:rabbitmq@localhost');
const exchange = connection.declareExchange('simplex');
const orderQueue = connection.declareQueue('orders');
const matchQueue = connection.declareQueue('matches');

orderQueue.bind(exchange);
matchQueue.bind(exchange);

orderQueue.startConsumer(msg => orderReciever$.next(msg));
matchQueue.startConsumer(msg => matchReciever$.next(msg));

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
    tap(saveOrder),
    map(order => simplex.doMatch(order)),
  )
  .subscribe();
/**
 * Finally pushing the messages onto the messages queue. or we can simply attach a database here.
 */
simplex.matchStream$.pipe(map(sendToMatchQueue)).subscribe();

// TODO: apply logic if we need to save it as a match or not. requires collision detection and book balancing.
// probably kafka or Apache Spark SQL is the right tool here.
matchReciever$.pipe(tap(saveMatch)).subscribe();
