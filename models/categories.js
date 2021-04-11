const path = require('path');
const { readJSON, writeJSON } = require('../utils/file-utils');
const _ = require('lodash');
const MyApplication = require('../classes/application');

/**
 * @typedef dataFile
 * @property {string} lastUpdated ISO String of last time the file was updated
 * @property {array} transactions List of actions taken against the data
 * @property {{ nextIndex: number }} meta Meta data about the table
 */

/**
 * @class
 * @property {string} dataPath location on the host machine where the data file will live 
 */
class MyCategories {

  /**
   * @constructor
   * @param {MyApplication} app 
   */
  constructor(pubSub) {
    this.dataPath = path.resolve(process.cwd(), 'data', 'categories.json');
    this.pubsub = pubSub;

    new Promise(async (resolve, reject) => {
      const dataFileExists = await readJSON(this.dataPath);
      
      if (dataFileExists.error) {
        await writeJSON(this.dataPath, { lastUpdated: new Date().toISOString(), data: [], transactions: [], meta: { nextIndex: 1 } }, true);
      }

      resolve();
    });

    this.pubsub.on('transaction-create', async (data) => {
      const category = _.get(data, 'category', '');
      const value = _.get(data, 'value', 0);

      await this.patch(category, { value });

      this._log('debug', 'Updated category', { category, value })
    })

  }

  _log(level, message, data) {
    console.log(`${new Date().toISOString()} | ${level} | MyCategories | ${message} ${JSON.stringify(data)}`);
  }

  async find(query) {
    const dataFile = await this._getFile();

    return dataFile.data;
  }

  async get(id) {
    const dataFile = await this._getFile();

    return dataFile.data[id];
  }

  async post(data) {
    const dataFile = await this._getFile();

    const _data = _.clone(data);
    _data.active = true;
    _data.id = dataFile.meta.nextIndex;

    dataFile.data.push(_data);
    dataFile.lastUpdated = new Date().toISOString();
    dataFile.meta.nextIndex++;
    dataFile.transactions.push({ action: 'create', timestamp: Date.now(), data: _data });


    await writeJSON(this.dataPath, dataFile, true);

    return _data;
  }

  async patch(id, data) {
    const dataFile = await this._getFile();
    const dataIndex = dataFile.data.findIndex(data => data.id === id);

    if (dataIndex === -1) {
      throw Error('Not Found');
    }

    const newValue = dataFile.data[dataIndex].value + data.value;

    dataFile.data[dataIndex] = _.merge(dataFile.data[dataIndex], data, { value: newValue, updatedAt: new Date().toISOString() });
    dataFile.lastUpdated = new Date().toISOString();

    dataFile.transactions.push({ action: 'patch', timestamp: Date.now(), data: { category_id: dataFile.data[dataIndex].id , data } });

    await writeJSON(this.dataPath, dataFile, true);

    return dataFile.data[dataIndex];
  }

  async delete(id) {
    /** @type {DataFile} */
    const dataFile = await this._getFile();

    const elem = dataFile.data.findIndex(data => data.id === id);

    if (elem === -1) {
      throw Error('Not Found');
    }

    dataFile.data = _.pullAt(dataFile.data, [ elem ]);
    dataFile.lastUpdated = new Date().toISOString();
    dataFile.transactions.push({ action: 'delete', timestamp: Date.now(), data: { id } });

    return;
  }

  async _getFile() {
    const { data, error} = await readJSON(this.dataPath);
    
    if (error) {
      throw ('Unable to access data file');
    }

    return data;
  }
}

module.exports = MyCategories;