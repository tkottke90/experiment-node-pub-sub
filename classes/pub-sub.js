const { EventEmitter } = require('events');

class MyPubSub {
  constructor() {
    this.emitter = new EventEmitter();
  }

  /**
   * Registers an event listener
   * @param {*} eventName 
   * @param {*} callback 
   */
  on(eventName, callback) {
    this.emitter.on(eventName, callback);
  }

  once(eventName, callback) {
    this.emitter.once(eventName, callback);
  }

  emit(eventName, ...args) {
    this.emitter.emit(eventName, ...args);
  }
}

module.exports = MyPubSub;