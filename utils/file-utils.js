const fs = require('fs');
const { promisify } = require('util');

/**
 * @typedef {Object} ReadJSONResponse
 * @property {Boolean} error Did an error occur attempting to read the file or parse it to JSON
 * @property {JSON} data Data contained in the file or an empty object if there was an error
 * @property {string} message Details about the results send back.  Will always be 'Success' for sucess and the message from the error if one occurred
 */

const readFile = promisify(fs.readFile);

/**
 * Read file and parse as JSON
 * @param {string} location Path in file system to access file
 * @returns {Promise<ReadJSONResponse>}
 */
const readJSON = async (location) => {
  try {
    const file = await readFile(location, 'utf8');
    const json = JSON.parse(file);
    return { error: false, data: json, message: 'Success' };
  } catch (err) {
    return { error: true, data: {}, message: err.message };
  }
}

const readDir = promisify(fs.readdir);

const writeFile = promisify(fs.writeFile);
const writeJSON = async (location, data, indent = false) => {
  return await writeFile(location, JSON.stringify(data, null, indent ? 2 : 0));
}

/**
 * Simple utility function that removes the extensions from filenames by splitting on the '.' character
 * @param {string} filename Name of the file to be parsed
 * @returns {string} First index of the filename 
 */
function removeExtensions(filename) {
  return filename.split('.')[0];
}

module.exports = {
  readDir,
  readFile,
  readJSON,
  removeExtensions,
  writeFile,
  writeJSON
}