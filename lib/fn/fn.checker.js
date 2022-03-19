let whitelistServers = process.env.SRV_ACCESS_LIST
  ? process.env.SRV_ACCESS_LIST.replace(/\s/g, '').split(',') || []
  : []

/**
 *
 * @param {*} origin  String to check
 * @returns {Boolean}       True if origin is valid or undefined
 */
const verifyOrigin = (origin) => {
  return typeof origin === 'undefined' ||
    (whitelistServers.length === 1 && whitelistServers[0] === '*') ||
    whitelistServers.indexOf(origin) !== -1
    ? true
    : false
}

// Get File Extention
const getFileExt = (file_full_path) => {
  // extracts file name from full path
  // (supports separators `\\` and `/`)
  let baseName = file_full_path.split(/[\\/]/).pop(),
    pos = baseName.lastIndexOf('.')
  if (baseName === '' || pos < 1) return ''
  return baseName.slice(pos + 1)
}

module.exports = {
  /**
   * Check if value is `[object object]` or {}
   *
   * @param {*} obj             Object to check
   * @returns {Boolean}         True if `[object Object]`
   */
  checkIfObject: (obj) => {
    return Object.prototype.toString.call(obj) === '[object Object]'
  },

  /**
   * Get file extention
   *
   * @param {String} file_full_path     File name or full path
   * @returns {String}                  File extention without (.)
   */
  getFileExt: getFileExt,

  /**
   * Validate file extention from list of valid extentions (`validExt`)
   *
   * @param {String} file                   File name or full path
   * @param {String | String[]} validExt    Valid extentions array or string for single extension validation
   * @returns {Boolean}                     True if valid extention
   */
  validateFileExtensions(file, validExt) {
    if (file && validExt) {
      const file_ext = getFileExt(file)
      if (!file_ext) return false
      if (!Array.isArray(validExt)) validExt = new Array().concat(validExt)
      if (validExt.includes(file_ext)) return true
      else if (validExt.length === 1 && validExt[0] === '*') return true
    }
    return false
  },

  /**
   *
   * @param {String} file         File to check permission
   * @param {["F_OK" | "R_OK" | "W_OK" | "F_OK"]} permisions
   *
   * `F_OK` file exist
   *
   * `R_OK` file is readable
   *
   * `W_OK` file is writeable
   *
   * `W_OK` file is writeable
   *
   * @param {Function} callback   Callback function
   * @callback callback
   */
  checkFileFolderPermision: (file, permisions, callback) => {
    if (!file || !permisions) return callback(new Error('Missing data!'))
    if (!Array.isArray(permisions)) permisions = new Array().concat(permisions)
    const { access, constants } = require('fs-extra')
    permisions.forEach((permision) => {
      access(file, constants[permision], (err) => {
        if (err) return callback(err)
      })
    })
    return callback(null, true)
  },

  /**
   * Check if .env has no missing configs
   */
  checkConfig: () => {
    const { envVars } = require('../data/db.structures')
    let response = {
      ok: true,
      missing: [],
    }
    envVars.forEach((evar) => {
      if (!process.env[evar]) {
        response.ok = false
        response.missing.push(evar)
      }
    })
    console.log({
      status: 'Checking Config',
      ...response,
    })
    return response
  },

  checkCors: {
    whitelistServers,

    verifyOrigin,

    appCorsOption: (origin, callback) => {
      if (verifyOrigin(origin)) {
        callback(null, true)
      } else {
        console.log('Request Blocked', JSON.stringify(origin))
        callback('Not allowed by CORS')
      }
    },

    socketCorsOptions: (request, callback) => {
      const getObj = require('lodash.get')
      const origin = getObj(request, 'headers.origin', '')
      if (verifyOrigin(origin)) {
        callback(null, true)
      } else {
        callback('Not allowed by CORS')
      }
    },

    socketAllowRequest: (request, callback) => {
      const data = {
        method: request.method,
        headers: request.headers,
      }
      console.log('Socket Request', JSON.stringify(data))
      callback(null, true)
    },
  },
}
