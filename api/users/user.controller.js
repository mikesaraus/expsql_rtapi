const {
  service_create,
  service_view,
  service_viewOptions,
  service_deleteBySingle,
  service_updateBySingle,
} = require("./user.service");
const _ = process.env;
const { regex_username } = require("../../lib/fn/fn.patters");
const { compareSync } = require("bcrypt");
const { block_keywords } = require("../../lib/data/blocklists");
const { encryptPassword, base64 } = require("../../lib/fn/fn.generator");
const {
  hideSomeColumns,
  errorJsonResponse,
  testget,
} = require("../../lib/fn/fn.db");
const {
  signToken,
  verifyCBPrivatePublicToken,
} = require("../../auth/token.service");

module.exports = {
  create: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    const data = req.body;
    const blklist = _.TXT_USERNAME_BLOCK_LIST
      ? _.TXT_USERNAME_BLOCK_LIST.replace(/\s/g, "").split(",") || []
      : [];
    let blklists = block_keywords.concat(
      blklist.filter((item) => blklist.indexOf(item) < 1)
    );
    if (data.username) data.username = data.username.toLowerCase();
    if (
      blklists.includes(data.username) ||
      !regex_username.test(data.username)
    ) {
      return res.json(errorJsonResponse({ detail: "Username Not Allowed" }));
    }
    if (data.password)
      data.password = encryptPassword(data.password, {
        encoded: !_.NODE_ENV || _.NODE_ENV != "production" ? false : true,
      });
    let payload = data;
    service_create(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        token: undefined,
        data: results ? results.rows[0] || [] : [],
      };
      jres.token = signToken(jres.data);
      console.log({
        command: results ? results.command : "",
        query: results ? results.query : "",
        rowCount: results ? results.rowCount : 0,
        response: jres,
      });
      jres.data = hideSomeColumns(hidden_columns, jres.data);
      return res.json(jres);
    });
  },

  view: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    let payload = { ...req.params, ...req.query };
    service_view(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        data: results ? (results.rowCount ? results.rows : []) : [],
      };
      console.log({
        command: results ? results.command : "",
        query: results ? results.query : "",
        rowCount: results ? results.rowCount : 0,
        response: jres,
      });
      jres.data = hideSomeColumns(hidden_columns, jres.data);
      return res.json(jres);
    });
  },

  updateByParam0: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    const __tokey = Object.keys(req.params)[0];
    const __toval = req.params[__tokey];
    const data = req.body;
    if (data.password)
      data.password = encryptPassword(data.password, {
        encoded: !_.NODE_ENV || _.NODE_ENV != "production" ? false : true,
      });
    let payload = {
      __toupdate: {
        __tokey: __tokey,
        __toval: __toval,
      },
      ...data,
    };
    service_updateBySingle(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows[0] || undefined : undefined,
      };
      console.log({
        command: results ? results.command : "",
        query: results ? results.query : "",
        rowCount: results ? results.rowCount : 0,
        response: jres,
      });
      jres.data = hideSomeColumns(hidden_columns, jres.data);
      return res.json(jres);
    });
  },

  deleteByParam0: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const __tokey = Object.keys(req.params)[0];
    const __toval = req.params[__tokey];
    let payload = {
      __toupdate: {
        __tokey: __tokey,
        __toval: __toval,
      },
    };
    service_deleteBySingle(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
      };
      console.log({
        command: results ? results.command : "",
        query: results ? results.query : "",
        rowCount: results ? results.rowCount : 0,
        response: jres,
      });
      jres.data = hideSomeColumns(hidden_columns, jres.data);
      return res.json(jres);
    });
  },

  deleteActionByParam0: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    const __tokey = Object.keys(req.params)[0];
    const __toval = req.params[__tokey];
    const verified = req.headers.verified;
    if (verified && verified.data && verified.data.userid) {
      const data = { status: "deactivated" };
      let payload = {
        __toupdate: {
          __tokey: __tokey,
          __toval: __toval,
        },
        ...data,
      };
      service_updateBySingle(payload, (err, results) => {
        if (err) {
          return res.json(errorJsonResponse(err));
        }
        let jres = {
          success: results ? (results.rowCount ? 1 : 0) : 0,
          data: results ? results.rows[0] || undefined : undefined,
        };
        console.log({
          command: results ? results.command : "",
          query: results ? results.query : "",
          rowCount: results ? results.rowCount : 0,
          response: jres,
        });
        jres.data = hideSomeColumns(hidden_columns, jres.data);
        return res.json(jres);
      });
    } else {
      return res.json(
        errorJsonResponse({ detail: "Verification error, please try again" })
      );
    }
  },

  logout: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    let __tokey = Object.keys(req.params)[0];
    let __toval = req.params[__tokey];
    const verified = req.headers.verified;
    if (verified && verified.data && verified.data.userid) {
      if (!__tokey || !__toval) {
        __tokey = "userid";
        __toval = verified.data.userid;
      }
      const data = { active_now: "no" };
      let payload = {
        __toupdate: {
          __tokey: __tokey,
          __toval: __toval,
        },
        ...data,
      };
      service_updateBySingle(payload, (err, results) => {
        if (err) {
          return res.json(errorJsonResponse(err));
        }
        let jres = {
          success: results ? (results.rowCount ? 1 : 0) : 0,
          data: results ? results.rows[0] || undefined : undefined,
        };
        console.log({
          command: results ? results.command : "",
          query: results ? results.query : "",
          rowCount: results ? results.rowCount : 0,
          response: jres,
        });
        jres.data = hideSomeColumns(hidden_columns, jres.data);
        return res.json(jres);
      });
    } else {
      return res.json(
        errorJsonResponse({ detail: "Verification error, please try again" })
      );
    }
  },

  loginWithPassword: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    let data = req.body;
    let __kbody = Object.keys(data);
    __kbody.splice(__kbody.indexOf("password"), 1);
    const __tokey = __kbody[0];
    const __toval = data[__tokey];
    let payload = {
      __toupdate: {
        __tokey: __tokey,
        __toval: __toval,
      },
      active_now: "yes",
      last_login: new Date(),
    };
    let _usr = {};
    _usr[payload.__toupdate.__tokey] = payload.__toupdate.__toval;
    service_view(_usr, (v_err, v_results) => {
      if (v_err) {
        return res.json(errorJsonResponse(v_err));
      } else if (v_results && v_results.rowCount) {
        data.password =
          !_.NODE_ENV || _.NODE_ENV != "production"
            ? data.password
            : base64.decode(data.password);
        const checkpwd = compareSync(
          data.password || "",
          v_results
            ? v_results.rowCount
              ? v_results.rows[0].password
              : ""
            : ""
        );
        if (checkpwd) {
          service_updateBySingle(payload, (err, results) => {
            if (err) {
              return res.json(errorJsonResponse(err));
            }
            let jres = {
              success: results
                ? results.rowCount
                  ? checkpwd
                    ? 1
                    : 0
                  : 0
                : 0,
              token: undefined,
              data: results
                ? results.rowCount
                  ? checkpwd
                    ? results.rows[0]
                    : undefined
                  : undefined
                : undefined,
            };
            if (jres.success) {
              jres.token = signToken(jres.data);
            } else {
              jres.error = {
                message: results
                  ? results.rowCount
                    ? checkpwd
                      ? "Login Successful"
                      : data.password
                      ? "Invalid Password"
                      : "Provide a Password"
                    : data.password
                    ? "Invalid User"
                    : "Password is Required"
                  : "Invalid Login",
              };
            }
            console.log({
              command: results ? results.command : "",
              query: results ? results.query : "",
              rowCount: results ? results.rowCount : 0,
              response: jres,
            });
            jres.data = hideSomeColumns(hidden_columns, jres.data);
            return res.json(jres);
          });
        } else {
          let jres = {
            success: 0,
            error: {
              message: data.pass ? "Password is Required" : "Invalid Password",
              // response: v_results,
            },
          };
          console.log({
            command: v_results ? v_results.command : "",
            query: v_results ? v_results.query : "",
            rowCount: v_results ? v_results.rowCount : 0,
            response: jres,
          });
          return res.json(jres);
        }
      } else {
        let jres = {
          success: 0,
          error: {
            message: "Invalid User",
            // response: v_results,
          },
        };
        console.log({
          command: v_results ? v_results.command : "",
          query: v_results ? v_results.query : "",
          rowCount: v_results ? v_results.rowCount : 0,
          response: jres,
        });
        return res.json(jres);
      }
    });
  },

  loginViaToken: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    let token = req.body
      ? req.method === "POST"
        ? req.body.token || undefined
        : req.query.token || undefined
      : undefined;
    let response;
    if (token) {
      let tokenError;
      verifyCBPrivatePublicToken(token, (err, result) => {
        if (err) {
          tokenError = errorJsonResponse({
            ...err,
            detail: err && err.expiredAt ? "Token is Expired" : "Invalid Token",
          });
        } else {
          console.log(result);
          result.data = hideSomeColumns(hidden_columns, result.data);
          response = { success: 1, ...result };
        }
      });
      if (tokenError) return res.json(tokenError);
    } else {
      return res.json(errorJsonResponse({ detail: "Token is Required" }));
    }
    if (response && typeof response === "object" && response.success === 1) {
      let hidden_columns = ["password"]; // columns to hide on response
      const userid = response.data.userid;
      service_viewOptions({ userid }, (err, results) => {
        if (err) {
          return res.json(errorJsonResponse(err));
        }
        let jres = {
          success: results ? (results.rowCount ? 1 : 0) : 0,
          data: results
            ? results.rowCount
              ? results.rows[0]
              : undefined
            : undefined,
          pkey: response.pkey,
          iat: response.iat * 1000 || undefined,
          exp: response.exp * 1000 || undefined,
        };
        console.log({
          command: results ? results.command : "",
          query: results ? results.query : "",
          rowCount: results ? results.rowCount : 0,
          response: jres,
        });
        jres.data = hideSomeColumns(hidden_columns, jres.data);
        return res.json(jres);
      });
    } else {
      return res.json(errorJsonResponse({ detail: "Invalid Login" }));
    }
  },
};
