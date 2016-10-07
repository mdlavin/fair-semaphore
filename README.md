A fair semaphore
================

[![Build Status](https://travis-ci.org/mdlavin/fair-semaphore.svg)](https://travis-ci.org/mdlavin/fair-semaphore)
[![NPM version](https://badge.fury.io/js/fair-semaphore.svg)](http://badge.fury.io/js/fair-semaphore)
[![Dependency Status](https://david-dm.org/mdlavin/fair-semaphore.svg)](https://david-dm.org/mdlavin/fair-semaphore)

With this module, you can block work from multiple incoming sources
and the work will be unblocked in a fair order. One source cannot cause
starvation of the other sources.

A fair queue could be used to schedule incoming requests from users, to make
sure that no user reduces the performance of other users on the same server.
Or, the queue could be used to balance outgoing requests to a downstream server,
making sure that one user does not consume all of the connections in a pool.


A simple example
----------------
In this example, source 1 will request two items of work before source 2 can
try to request anything.  But, when the work is unblocked, the work from source
2 will be unlocked first so that source 1 does not starve source 2.

```js
const FairSemaphore = require('fair-semaphore');
const semaphore = new FairSemaphore();

semaphore.take('source1', function () {
  console.log('Inside first request from source 1');
  semaphore.leave();
});

semaphore.take('source1', function () {
  console.log('Inside second request from source 1');
  semaphore.leave();
});

semaphore.take('source2', function () {
  console.log('Inside first request from source 2');
  semaphore.leave();
});
```

When the above code is executed, the output will be

    Inside first request from source 1
    Inside first request from source 2
    Inside second request from source 1

Notice that the request for source 2 was allowed before the second request from
source 1, so that source 1's double requests did not starve source 2.



