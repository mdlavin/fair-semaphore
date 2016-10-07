require('co-mocha');
const FairSemaphore = require('../src/index');
const sinon = require('sinon');
const Promise = require('bluebird');
const expect = require('chai').expect;

function * testBlockingTake (firstKey, secondKey) {
  const semaphore = new FairSemaphore();
  const firstTake = sinon.stub();
  const secondTake = sinon.stub();

  semaphore.take(firstKey, firstTake);
  semaphore.take(secondKey, secondTake);

  yield Promise.delay(10);

  sinon.assert.calledOnce(firstTake);
  sinon.assert.notCalled(secondTake);

  yield Promise.delay(10);

  // Assert second take is still not run, just to be paranoid that
  // more waiting would have let it run.
  sinon.assert.notCalled(secondTake);

  semaphore.leave();

  yield Promise.delay(10);
  sinon.assert.calledOnce(secondTake);
}

function expectUnpariedLeaveError (func) {
  expect(func).to.throw(Error, 'Leave was called too many times');
}

describe('A fair semaphore', function () {
  it('will block a take with the same key until the capacity is available', function * () {
    yield * testBlockingTake('test', 'test');
  });

  it('will block a take with a different key until the capacity is available', function * () {
    yield * testBlockingTake('test', 'test 2');
  });

  it('throws an error when leave is called before a take', function () {
    const semaphore = new FairSemaphore();
    expectUnpariedLeaveError(semaphore.leave.bind(semaphore));
  });

  it('throws an error when leave is called too many times', function * () {
    const semaphore = new FairSemaphore();

    yield Promise.fromCallback((callback) => semaphore.take('test', callback));

    semaphore.leave();
    expectUnpariedLeaveError(semaphore.leave.bind(semaphore));
  });

  it('will unblock waiters with different keys in a fair ordering', function * () {
    const semaphore = new FairSemaphore();

    function immediateLeave () {
      semaphore.leave();
    }

    const a1 = sinon.spy(immediateLeave);
    const a2 = sinon.spy(immediateLeave);
    const a3 = sinon.spy(immediateLeave);
    const a4 = sinon.spy(immediateLeave);
    const b1 = sinon.spy(immediateLeave);
    const b2 = sinon.spy(immediateLeave);

    // Have 'a' request a lot of takes and then have 'b'
    // request some
    semaphore.take('a', a1);
    semaphore.take('a', a2);
    semaphore.take('a', a3);
    semaphore.take('a', a4);
    semaphore.take('b', b1);
    semaphore.take('b', b2);

    // Let the waiters execute
    yield Promise.delay(10);

    // Verify that 'b' is not starved out by the 'a' requests
    sinon.assert.callOrder(a1, b1, a2, b2, a3, a4);
  });
});
