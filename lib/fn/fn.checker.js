const _ = process.env;
const { envVars } = require("../data/db.structures");

module.exports = {
  checkConfig: () => {
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
};
