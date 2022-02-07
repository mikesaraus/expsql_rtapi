const {
  service_create,
  service_view,
  service_deleteBySingle,
  service_updateBySingle,
  service_viewSummary,
  service_viewReport,
} = require("./trans.service");
const _ = process.env;
const { hideSomeColumns, errorJsonResponse } = require("../../lib/fn/fn.db");
const { block_keywords } = require("../../lib/data/blocklists");

module.exports = {
  create: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = req.body;
    let payload = data;
    const blklist = _.TXT_USERNAME_BLOCK_LIST
      ? _.TXT_USERNAME_BLOCK_LIST.replace(/\s/g, "").split(",") || []
      : [];
    let blklists = block_keywords.concat(
      blklist.filter((item) => blklist.indexOf(item) < 1)
    );
    if (blklists.includes(data.account_name)) {
      return res.json(
        errorJsonResponse({ detail: "Account Name Not Allowed" })
      );
    }
    service_create(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        data: results ? results.rows[0] || [] : [],
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

  view: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = { ...req.params, ...req.query };
    let payload = data;
    service_view(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        data: results ? results.rows || [] : [],
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

  viewNotDeleted: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = { ...req.params, ...req.query };
    data.deleted = data.deleted ? `:is:null~~${data.deleted}` : ":is:null";
    let payload = data;
    service_view(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        data: results ? results.rows || [] : [],
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

  viewDeleted: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = { ...req.params, ...req.query };
    data.deleted = data.deleted
      ? `:isnot:null~~${data.deleted}`
      : ":isnot:null";
    let payload = data;
    service_view(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: 1,
        data: results ? results.rows || [] : [],
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

  viewSummary: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = req.query;
    let payload = data;
    service_viewSummary(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows[0] : undefined,
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

  viewSummaryNotDeleted: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = req.query;
    data.deleted = data.deleted ? `:is:null~~${data.deleted}` : ":is:null";
    let payload = data;
    service_viewSummary(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows[0] : undefined,
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

  viewSummaryDeleted: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = req.query;
    data.deleted = data.deleted
      ? `:isnot:null~~${data.deleted}`
      : ":isnot:null";
    let payload = data;
    service_viewSummary(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows[0] : undefined,
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

  viewReport: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = { ...req.params, ...req.query };
    let payload = data;
    service_viewReport(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows : undefined,
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

  viewReportNotDeleted: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = { ...req.params, ...req.query };
    data.deleted = data.deleted ? `:is:null~~${data.deleted}` : ":is:null";
    let payload = data;
    service_viewReport(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows : undefined,
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

  viewReportDeleted: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const data = { ...req.params, ...req.query };
    data.deleted = data.deleted
      ? `:isnot:null~~${data.deleted}`
      : ":isnot:null";
    let payload = data;
    service_viewReport(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows : undefined,
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

  deleteActionByParam0: (req, res) => {
    let hidden_columns = []; // columns to hide on response
    const __tokey = Object.keys(req.params)[0];
    const __toval = req.params[__tokey];
    const verified = req.headers.verified;
    if (verified && verified.data && verified.data.userid) {
      const data = { deleted: new Date(), updated_by: verified.data.userid };
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
};
