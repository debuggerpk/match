import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Exchange } from './lib/exchange';
import { generateRandomOrder } from './lib/order';
import { createBuyQueue, createSellQueue } from './lib/queues';

const exchange = new Exchange(createBuyQueue(), createSellQueue());

interval(0.001)
  .pipe(
    map(generateRandomOrder),
    map(order => exchange.match(order)),
  )
  .subscribe();
