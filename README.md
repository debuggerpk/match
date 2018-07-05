# Introduction

Although the test doesn't cover it, but in real life, the overall solution needs to address the following.

1.  Concurrency and Collision Detection
1.  Latency (Could be network, could be speed of execution, could be because of bad garbage collection).
1.  State Management.

To solve collision issue, we deal this as stream computing problem. and split the incoming order stream into two binary heap priority queues.

1.  Sell Queue (With the smallest at the top).
1.  Buy Queue

The Priority Queue, an implementation of binary heap, with smallest item on top is an obvious choice for Sell Queue. Since the complexity for insertion is O(log n) for both, but when it comes to reading, the match is always at the top of the heap.

The best algorithm for chosing the best buy match against a sell order, this is where it gets tricky. For buying match, our first priority is the to get the closest buy order that came first. The binary search tree is binary by definition, i.e. the sort takes place based on one condition. I am implementing a simple array here, with simple filtering.

## Note on Real-life Problem

> In real life, on an exchange with a large through put, we will have multiple machines doing the matching and sending to processing queue, the collision detection would require matches to be verfied against another lock stream before being notified back to user.

# Getting Started

## Pre-requisites

1.  Node v8.11 or higher
1.  Docker

## Installation

Depending upon the package manager of choice, i.e. `npm`, `yarn` or `npx`.

```bash
<package-manager> install
```

For me, my go choice is yarn, so

```bash
yarn install
```

## Simulation

### Yarn

```bash
docker-compose up -d
yarn simulate
```

### NPM

```bash
docker-compose up -d
npm run simulate
```

## Testing

```bash
yarn test
```

## Documentation

The documentation is generated automatically using excellent typedoc and can be found in `/docs/` folder. To regenerate, run

```bash
yarn docs:html
```

## Performance

The required performance is to process more than 1000 matches per second. as you can see from the picture

![Imgur](https://i.imgur.com/cDIkx3D.png)
