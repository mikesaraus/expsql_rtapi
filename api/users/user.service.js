const _ = process.env;
const { queryVars2Vals, queryConditioner } = require("../../lib/fn/fn.db");
const pg_client = require("../../config/database");
const { dbTables } = require("../../lib/data/db.structures");
// db table
const table = _.DB_TBL_USERS;

module.exports = {
  service_create: (data, callBack) => {
    let noncol = data.__noncol || []; // keys not to include as columns
    if (noncol.length && !noncol.includes("__noncol")) noncol.push("__noncol");
    let important = data.__important || ["username", "password"]; // required keys to add as column
    let cols = Object.keys(data) || {};
    let missingData = [];
    important.forEach((col) => {
      if (!cols.includes(col)) missingData.push(col);
    });
    if (missingData.length)
      return callBack({ detail: `Missing Data: ${missingData}` });
    if (noncol.length)
      noncol.forEach((key) => {
        if (cols.includes(key)) cols.splice(cols.indexOf(key), 1);
      });
    let pg_setvals = [];
    let pg_query = `INSERT INTO ${table}(${cols}) VALUES(`;
    for (var i = 1; i <= cols.length; i++) {
      pg_query += `$` + i;
      if (i != cols.length) pg_query += `, `;
      pg_setvals.push(data[cols[i - 1]]);
    }
    pg_query += `) RETURNING *;`;
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals);
        return callBack(error);
      }
      results.query = queryVars2Vals(pg_query, pg_setvals);
      return callBack(null, results);
    });
  },

  service_view: (data, callBack) => {
    let __colsData = dbTables[table].columns;
    let pg_query = `SELECT * FROM ${table}`;
    data.pg_query = pg_query;
    let { query_cond, query_endstement, query_vals } = queryConditioner(
      data,
      __colsData
    );
    if (query_cond.length) pg_query += ` WHERE ${query_cond.join(" AND ")}`;
    if (query_endstement.length) pg_query += ` ${query_endstement.join(" ")}`;
    let pg_setvals = [];
    if (query_vals.length) pg_setvals.push(...query_vals);
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals);
        return callBack(error);
      }
      results.query = queryVars2Vals(pg_query, pg_setvals);
      return callBack(null, results);
    });
  },

  service_viewOptions: (data, callBack) => {
    const __tokey = Object.keys(data)[0];
    pg_query = `SELECT * FROM ${table} WHERE ${__tokey}${
      data.__match_like ? " LIKE " : "="
    }$1`;
    if (data.limit && !isNaN(data.limit))
      pg_query = `${pg_query} LIMIT ${data.limit}`;
    if (data.offset && !isNaN(data.offset))
      pg_query = [pg_query, "OFFSET", data.offset].join(" ");
    let _doorder = true;
    let _noorder = ["LIMIT", "OFFSET"];
    _noorder.forEach((word) => {
      if (pg_query.toLowerCase().includes(` ${word.toLowerCase()} `))
        _doorder = false;
    });
    if (_doorder) pg_query += " ORDER BY id";
    let pg_setvals = [data[__tokey]];
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals);
        return callBack(error);
      }
      results.query = queryVars2Vals(pg_query, pg_setvals);
      return callBack(null, results);
    });
  },

  service_updateBySingle: (data, callBack) => {
    let noncol = data.__noncol || [
      "id",
      "userid",
      "username",
      "__noncol",
      "__important",
      "__toupdate",
      "__options",
    ]; // keys not to include as columns
    if (noncol.length && !noncol.includes("__noncol")) noncol.push("__noncol");
    let important = data.__important || ["__toupdate"]; // ["id", "userid", "username"] required keys to add as column
    let cols = Object.keys(data) || {};
    let missingData = [];
    important.forEach((col) => {
      if (!cols.includes(col)) missingData.push(col);
    });
    if (missingData.length)
      return callBack({ detail: `Missing Data: ${missingData}` });
    const toupdate = data.__toupdate;
    if (noncol.length)
      noncol.forEach((key) => {
        if (cols.includes(key)) cols.splice(cols.indexOf(key), 1);
      });
    let pg_setvals = [];
    let pg_query = `UPDATE ${table} SET `;
    for (var i = 1; i <= cols.length; i++) {
      pg_query += cols[i - 1] + `=$${i}`;
      if (i != cols.length) pg_query += `, `;
      pg_setvals.push(data[cols[i - 1]]);
    }
    pg_query += ` WHERE ${toupdate.__tokey}=$${cols.length + 1} RETURNING *`;
    pg_setvals.push(toupdate.__toval);
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals);
        return callBack(error);
      }
      results.query = queryVars2Vals(pg_query, pg_setvals);
      return callBack(null, results);
    });
  },

  service_deleteBySingle: (data, callBack) => {
    let important = data.__important || ["__toupdate"]; // required keys to add as column
    let cols = Object.keys(data) || {};
    let missingData = [];
    important.forEach((col) => {
      if (!cols.includes(col)) missingData.push(col);
    });
    if (missingData.length)
      return callBack({ detail: `Missing Data: ${missingData}` });
    const toupdate = data.__toupdate;
    let pg_setvals = [toupdate.__toval];
    let pg_query = `DELETE FROM ${table} WHERE ${toupdate.__tokey}=$1`;
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals);
        return callBack(error);
      }
      results.query = queryVars2Vals(pg_query, pg_setvals);
      return callBack(null, results);
    });
  },
};
