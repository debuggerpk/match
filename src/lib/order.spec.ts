import ava from 'ava';
import { Order, generateOrderType, generatePrice, generateQuantity, generateRandomOrder } from './order';

ava('Order: new Order() working successfully', test => {
  const order = generateRandomOrder();

  test.is(typeof order.price, 'number');
  test.is(typeof order.quantity, 'number');
  test.is(typeof order.createdAt, 'object');
  test.is(typeof order.updatedAt, 'object');
  test.is(typeof order.id, 'string');
});
