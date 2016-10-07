const FairQueue = require('drr-fair-queue');

function FairSemaphore (capacity) {
  if (capacity === undefined) {
    capacity = 1;
  }
  this._capacity = capacity;
  this._active = 0;
  this._queue = new FairQueue();
}

FairSemaphore.prototype._runToCapacity = function () {
  if (this._queue.length < 1) {
    // Nothing to do
    return;
  }

  // If the amount of active work is less than the capacity
  // then pull the new bit of work and get started
  if (this._active < this._capacity) {
    const nextWork = this._queue.pop();
    this._active++;
    process.nextTick(nextWork);
  }
};

FairSemaphore.prototype.leave = function () {
  if (this._active < 1) {
    throw new Error('Leave was called too many times');
  }
  this._active--;
  this._runToCapacity();
};

FairSemaphore.prototype.take = function (key, func) {
  this._queue.push(key, func, 1);
  this._runToCapacity();
};

module.exports = FairSemaphore;
