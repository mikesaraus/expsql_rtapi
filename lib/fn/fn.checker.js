const _ = process.env;
const getObj = require("lodash.get");
const { access, constants } = require("fs");

let whitelistServers = _.SRV_ACCESS_LIST
  ? _.SRV_ACCESS_LIST.replace(/\s/g, "").split(",") || []
  : [];

const verifyOrigin = (origin) => {
  return typeof origin === "undefined" ||
    whitelistServers.indexOf(origin) !== -1
    ? true
    : false;
};

const getFileExt = (file_full_path) => {
  let baseName = file_full_path.split(/[\\/]/).pop(), // extracts file name from full path
    // (supports separators `\\` and `/`)
    pos = baseName.lastIndexOf("."); // gets the last position of `.`
  if (baseName === "" || pos < 1)
    // if the file name is empty or ...
    return ""; // the dot not found (-1) or comes first (0)
  return baseName.slice(pos + 1); // extracts extension ignoring "."
};

module.exports = {
  whitelistServers,
  /**
   * Check if value is `[object object]` or {}
   *
   * @param {*} obj object to check
   * @returns boolean `true` if `object` else `false`
   */
  checkIfObject: (obj) => {
    return Object.prototype.toString.call(obj) === "[object Object]";
  },

  /**
   *
   * @param {String} file_full_path file name or full path
   * @returns string file extention without (.)
   */
  getFileExt: getFileExt,

  /**
   *
   * @param {string} file file name or full path
   * @param {String | String[]} validExt valid extentions array or string for single extension validation
   * @returns boolean `true` if valid extention else `false`
   */
  validateFileExtensions(file, validExt) {
    if (file && validExt) {
      const file_ext = getFileExt(file);
      if (!file_ext) return false;
      if (!Array.isArray(validExt)) validExt = new Array().concat(validExt);
      if (validExt.includes(file_ext)) return true;
      else if (validExt.length === 1 && validExt[0] === "*") return true;
    }
    return false;
  },

  /**
   *
   * @param {String} file - file to check permission
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
   * @param {Function} callback
   */
  checkFileFolderPermision: (file, permisions, callback) => {
    if (!file || !permisions) return callback(new Error("Missing data!"));
    if (!Array.isArray(permisions)) permisions = new Array().concat(permisions);
    permisions.forEach((permision) => {
      access(file, constants[permision], (err) => {
        if (err) return callback(err);
      });
    });
    return callback(null, true);
  },

  /**
   * Check if .env has no missing configs
   */
  checkConfig: () => {
    const { envVars } = require("../data/db.structures");
    let response = {
      ok: true,
      missing: [],
    };
    envVars.forEach((evar) => {
      if (!_[evar]) {
        response.ok = false;
        response.missing.push(evar);
      }
    });
    console.log({
      status: "Checking Config",
      ...response,
    });
    return response;
  },

  checkCors: {
    whitelistServers,

    verifyOrigin,

    appCorsOption: (origin, callback) => {
      if (verifyOrigin(origin)) {
        callback(null, true);
      } else {
        console.log("Request Blocked", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },

    socketCorsOptions: (request, callback) => {
      const origin = getObj(request, "headers.origin", "");
      if (verifyOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },

    socketAllowRequest: (request, callback) => {
      const data = {
        method: request.method,
        headers: request.headers,
      };
      console.log("Socket Request", data);
      callback(null, true);
    },
  },
};
