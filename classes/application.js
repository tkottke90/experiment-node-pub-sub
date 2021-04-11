const _ = require('lodash');
const MyExpressApp = require("./express.class");
const MyPubSub = require('./pub-sub');

class MyBaseClass { }

class MyApplication extends MyExpressApp(MyBaseClass) {

  constructor() {
    super();

    this.pubSub = new MyPubSub();
  }

}

module.exports = MyApplication;