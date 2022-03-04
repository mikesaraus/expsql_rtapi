const {
    service_create,
    service_view,
    service_deleteBySingle,
    service_updateBySingle,
  } = require("./company.service"),
  _ = process.env,
  { block_keywords } = require("../../lib/data/blocklists"),
  { hideSomeColumns, errorJsonResponse } = require("../../lib/fn/fn.db"),
  { signToken } = require("../../auth/token.service");

module.exports = {
  create: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = req.body;
    const blklist = _.TXT_USERNAME_BLOCK_LIST
      ? _.TXT_USERNAME_BLOCK_LIST.replace(/\s/g, "").split(",") || []
      : [];
    let blklists = block_keywords.concat(
      blklist.filter((item) => blklist.indexOf(item) < 1)
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
    let hidden_columns = []; // columns to hide on response
    let payload = {}; // { ...req.params, ...req.query };
    service_view(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        data: results ? (results.rowCount ? results.rows[0] : {}) : {},
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
    let hidden_columns = []; // columns to hide on response
    const __tokey = Object.keys(req.params)[0];
    const __toval = req.params[__tokey];
    const data = req.body;
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
};
