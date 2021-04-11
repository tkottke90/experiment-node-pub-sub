const MyApplication = require('../classes/application');
const MyTransaction = require('../models/transactions');
const MyCategories = require('../models/categories');
const routeLog = require('../middleware/route-log');

/**
 * Register routes with expressjs
 * @param {MyApplication} app 
 */
module.exports = (app) => {
  const transactions = new MyTransaction(app.pubSub);
  const categories = new MyCategories(app.pubSub);

  app.registerRoute('/v1/transactions', 'find', transactions);
  app.registerRoute('/v1/transactions/:id', 'get', transactions);
  app.registerRoute('/v1/transactions', 'post', transactions);

  app.registerRoute('/v1/categories', 'find', categories);
  app.registerRoute('/v1/categories/:id', 'get', categories);
  app.registerRoute('/v1/categories', 'post', categories);

  app.express.use('*', routeLog, (req, res, next) => {
    res.status(405).send('Unused Route');
  });
}