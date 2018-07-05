import cuid from 'cuid';
/**
 * Defines the OrderType
 *
 * @export
 * @enum {number}
 */
export enum OrderType {
  BUY,
  SELL,
}

// export type OrderPriceGenerator = () => number;
// export type OrderQuantityGenerator = () => number;
// export type OrderTypeGenerator = () => OrderType;
// export type OrderGenerator = () => Order;

/**
 * Defines the Order
 *
 * @export
 * @class Order
 */
export class Order {
  public static orderTypes: Array<OrderType> = [OrderType.BUY, OrderType.SELL];

  public id: string = cuid();
  public createdAt: Date = new Date();
  public updatedAt: Date = new Date();
  public price: number;
  public quantity: number;
  public type: OrderType;

  /**
   * Creates an instance of Order.
   *
   * Usage:
   *
   * if we are given a order of size 50 with a buy price of 100, then
   *
   * const order = new Order(100, 50, 'Buy')
   *
   * @param {number} price
   * @param {number} quantity
   * @param {OrderType} type
   * @memberof Order
   */
  constructor(price: number, quantity: number, type: OrderType) {
    this.price = price;
    this.quantity = quantity;
    this.type = type;
  }
}

export const generatePrice: () => number = () => Math.floor(Math.random() * 250);
export const generateQuantity: () => number = () => Math.floor(Math.random() * 250);

export const generateOrderType: () => OrderType = () =>
  Order.orderTypes[Math.floor(Math.random() * Order.orderTypes.length)];

export const generateRandomOrder: () => Order = () =>
  new Order(generatePrice(), generateQuantity(), generateOrderType());
