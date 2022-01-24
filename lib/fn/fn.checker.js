const _ = process.env;

module.exports = {
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
};
