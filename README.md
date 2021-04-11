# Experiment: NodeJS Internal Pub/Sub

I have been working with Javascript as a backend for a few years now.  I have used ExpressJS, Socket.io, and FeathersJS primarily when working with HTTP connections.  One of the challenges I have run into with production applications is the innerconnectivity between data models.  An example would be the relationship between a transaction and an account that it is associated with.  When a user submits a transaction, they expect that their account balance will reflect the change that the transaction describes.  

When I have approached this problem in the past, I have typically leveraged the model directly to inact the cascading changes that need to be made based on the users input.  Those steps might look like:

1. The user submits an new transaction to the application
1. The application updates the database by adding a new record
1. The application gets an instance of the _account_ model
1. The application updates the database by modifying the associated _account_ record
1. The application returns the details about the newly created transaction to the user

I have use this process successfully in production with FeathersJS and on my current project I had the same expectations.  These were however quickly dashed as the secondary service I was looking to call, did not provide the full breath of functionality that I needed.  This service was very curiated for the end user to consume.  With the little DRY bell going off in my head at the thought of having to recreate the methods by hand, I went searching for a better answer.

## How to use this repository

This repository is designed to be a proof of concept around using the EventEmitter class to create an internal Pub/Sub system for inter-model communication.

To get started install the dependencies:
```sh
npm install
```

Once everything is installed, start the project by running:
```sh
npm start
```

You should see the following output: 
```sh
Server listening on 0.0.0.0:3000
```

I recommend either tailing or opening in your editor the `data/transaction.json` and `data/categories.json` files.  This will allow you to watch them change as you provide inputs.  Using some JSON files here as my "database" because I am too lazy to get a full DB setup.

The final step is to use your API debugger of choice or cURL to access the express endpoints.  To get start create a new category:
```bash
curl --request POST \
  --url http://localhost:3000/v1/categories \
  --header 'Content-Type: application/json' \
  --data '{
	"name": "Savings",
	"value": 0,
	"updatedAt": "2021-04-11T00:16:11.766Z",
	"createdAt": "2021-04-11T00:16:11.766Z"
}'
```

This should return the following:
```bash
{
  "name": "Savings",
  "value": 0,
  "updatedAt": "2021-04-11T00:09:29.200Z",
  "createdAt": "2021-04-11T00:09:29.200Z",
  "active": true,
  "id": 1
}
```

Grab the `id` from the response and create a transaction:
```bash
curl --request POST \
  --url http://localhost:3000/v1/transactions \
  --header 'Content-Type: application/json' \
  --data '{
	"timestamp": "1618100234992",
	"description": "Amazon",
	"value": 100,
	"category": 1
}'
```

You should see 2 additional logs now in the terminal:
```bash
Server listening on 0.0.0.0:3000
2021-04-11T00:23:08.284Z | HTTP | POST /v1/transactions
2021-04-11T00:23:08.292Z | debug | MyCategories | Updated category {"category":1,"value":100}
```

The first acknowledges that the an HTTP request was received by Express at `/v1/transactions`.  The second shows that the MyCategories class recieved a request to update category #1 with a `+100` to the value.

Review the `categories.json` file and you should now see that your category has a `value` equal to the `value` that was submitted with the transaction.  You can post as many transactions as you will like and this repo does not focus on ensuring that the categories balance (`value`) is always set correctly.

The key is to show that submitting a transaction had an effect on a category which is done without either the transaction or category models having knowledge of how to manipulate the other.  

## Deep Dive

The setup of this was straight forward.  Installed `express`, `nodemon`.

```sh
# Installation
npm install -P express
npm install -D nodemon
```

I configured my directories like this:
```
./
├── README.md
├── classes
│   ├── application.js
│   ├── express.class.js
│   └── pub-sub.js
├── models
│   ├── categories.js
│   └── transactions.js
├── data
│   ├── categories.json
│   └── transaction.json
├── index.js
├── middleware
│   └── route-log.js
├── nodemon.json
├── package-lock.json
├── package.json
├── routes
│   └── index.js
└── utils
    └── file-utils.js
```

The magic sauce that makes this all work is in in the `/classes/pub-sub.js` file.  Which is essentially a wrapper around NodeJS' EventEmitter class:
```js
this.emitter = new EventEmitter();
```

Once we have this configured.  In this project we use a little dependency injection to apply it to each of the models as part of the constructor:

```js
class MyTransaction {
  constructor(pubSub) {
    this.pubSub = pubSub;
  }
}
```

Then we simply need to emit an event to get started.  Here we add an emit call to the `post` method of the class which will trigger whenever we create a transaction:
```js
class MyTransaction {
  ...
  async post(data) {
    ...

    this.pubsub.emit('transaction-create', data);

    return data;
  }
}
```

From here the MyTransaction model is done, and does not need to concern itself with any additional tasks and can respond to the client.  Meanwhile in the MyCategories model, we can setup a listener when we instantiate the class:
```js
const _ = require('lodash');

class MyCategories {
  constructor(pubSub) {
    this.pubsub = pubSub;

    this.pubsub.on('transaction-create', async (data) => {
      const category = _.get(data, 'category', '');
      const value = _.get(data, 'value', 0);

      await this.patch(category, { value });

      this._log('debug', 'Updated category', { category, value })
    })

  }
```

Here we are listening for that event that will be emitted by the MyTransaction model.  When that event is emitted this callback will be triggered and take care of calling the `patch` method on this class correctly to update the category.

## Conclusion

This was a neat little one day build to learn about how to leverage the EventEmitter class in the future.  