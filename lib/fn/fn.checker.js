const _ = process.env;

let whitelistServers = _.SRV_ACCESS_LIST
  ? _.SRV_ACCESS_LIST.replace(/\s/g, "").split(",") || []
  : [];

async function verifyOrigin(origin) {
  return typeof origin === "undefined" ||
    whitelistServers.indexOf(origin) !== -1
    ? true
    : false;
}

module.exports = {
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
      const origin =
        request && request.headers ? request.headers.origin || "" : "";
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
