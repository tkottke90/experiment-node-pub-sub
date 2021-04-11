const express = require('express');
const routeLog = require('../middleware/route-log');

const MyExpressApp = superclass => class extends superclass {
  constructor() {
    super();
    this.express = express();
    this.express.use(express.json())
  }

  /**
   * Starts the express enpoint on a specific port
   * @param {number} port Port number to bind the application do
   * @returns {void} 
   */
  ready(port) {
    const host = '0.0.0.0';
    this.express.listen(port, host, () => {
      console.log(`Server listening on ${host}:${port}`);
    });
  }

  /**
   * @typedef {'find' | 'get' | 'post' | 'patch' | 'delete'} HTTPMethods
   */

  /**
   * 
   * @param {URL} path 
   * @param { HTTPMethods } method 
   * @param {*} controller
   */
  registerRoute(path, method, controller) {
    let _method = method;

    if (_method ==='find') {
      _method = 'get';
    }

    this.express[_method](path, routeLog, this.wrapController(controller, method));
  }

  /**
   * @typedef WrapOptions
   * @property {boolean} invokeNext Should the wrapper method call next or res.json after the callback is complete
   */

  /**
   * Wraps a controller method so it can be invoked by express
   * @param {Function} controller 
   * @param { HTTPMethods } method
   * @param {WrapOptions} options 
   * @returns 
   */
  wrapController(controller, method, options = { invokeNext: false, mode: 'get' }) {
    let _method = method;
    let request = [];

    return async function(req, res, next) {
      switch(_method) {
        case 'post':
          request = [req.body]
          break;
        case 'find':
          request = [req.query]
          break;
        case 'patch':
          request = [req.body, req.params]
          break;
        case 'delete':
        case 'get':
        default:
          request = [req.params.id]
      }

      let response;
      try {
        response = await controller[method](...request);
      } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message, stack: error.stack })
      }

      res.status(200).json(response);
    }
  }
}



module.exports = MyExpressApp;