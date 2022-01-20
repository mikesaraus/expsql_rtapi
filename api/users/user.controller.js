const {
  service_create,
  service_view,
  service_viewOptions,
  service_deleteBySingle,
  service_updateBySingle,
} = require("./user.service");
const _ = process.env;
const { hideSomeColumns, errorJsonResponse } = require("../../lib/fn/fn.db");
const { regex_username } = require("../../lib/fn/fn.patters");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");
const { block_usernames } = require("../../lib/data/blocklists");
const {
  signToken,
  verifyCBPrivatePublicToken,
} = require("../../auth/token.service");

module.exports = {
  create: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    const data = req.body;
    const blklist =
      _.TXT_USERNAME_BLOCK_LIST.replace(/\s/g, "").split(",") || [];
    let blklists = block_usernames.concat(
      blklist.filter((item) => blklist.indexOf(item) < 1)
    );
    data.username = data.username.toLowerCase();
    if (
      blklists.includes(data.username) &&
      regex_username.test(data.username)
    ) {
      return res.json(errorJsonResponse(undefined, "Username Not Allowed"));
    }
    if (data.password)
      data.password = hashSync(
        data.password,
        genSaltSync(parseInt(_.TOKEN_SALT_DEG || 10))
      );
    let payload = data;
    service_create(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        token: undefined,
        data: results ? results.rows[0] || [] : [],
        // response: results,
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
    let payload = req.query;
    service_view(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        data: results ? (results.rowCount ? results.rows : []) : [],
        // response: results,
      };
      console.log({
        command: results ? results.command : "",
        query: results ? results.query : "",
        rowCount: results ? results.rowCount : 0,
        response: jres,
      });
      jres.data = hideSomeColumns(
        hidden_columns,
        jres.data,
        Array.isArray(jres.data)
      );
      return res.json(jres);
    });
  },

  updateByParam0: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    const __tokey = Object.keys(req.params)[0];
    const __toval = req.params[__tokey];
    const data = req.body;
    if (data.password)
      data.password = hashSync(
        data.password,
        genSaltSync(parseInt(_.TOKEN_SALT_DEG || 10))
      );
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
        // response: results,
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

  loginWithPassword: (req, res) => {
    let hidden_columns = ["password"]; // columns to hide on response
    let data = req.body;
    let __kbody = Object.keys(data);
    __kbody.splice(__kbody.indexOf("password"), 1);
    const __tokey = __kbody[0];
    const __toval = data[__tokey];
    let payload = {};
    payload[__tokey] = __toval;
    service_viewOptions(payload, async (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      const checkpwd = compareSync(
        data.password || "",
        results ? (results.rowCount ? results.rows[0].password : "") : ""
      );
      let jres = {
        success: results ? (results.rowCount ? (checkpwd ? 1 : 0) : 0) : 0,
        token: undefined,
        data: results
          ? results.rowCount
            ? checkpwd
              ? results.rows[0]
              : undefined
            : undefined
          : undefined,
        // response: results,
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
          tokenError = errorJsonResponse(err, "Invalid Token");
        } else {
          console.log(result);
          result.data = hideSomeColumns(hidden_columns, result.data);
          response = { success: 1, ...result };
        }
      });
      if (tokenError) return res.json(tokenError);
    } else {
      return res.json(errorJsonResponse(undefined, "Token is Required"));
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
          // response: results,
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
      return res.json(errorJsonResponse(undefined, "Invalid Login"));
    }
  },
};
