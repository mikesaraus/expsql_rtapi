const _ = process.env,
  { queryVars2Vals, queryConditioner } = require('../../lib/fn/fn.db'),
  { pg_client } = require('../../config').database,
  { dbTables } = require('../../lib/data/db.structures'),
  getObj = require('lodash.get')
// db table
const table = _.DBTBL_ACCOUNTS

module.exports = {
  service_create: (data, callBack) => {
    let noncol = data.__noncol || [] // keys not to include as columns
    if (noncol.length && !noncol.includes('__noncol')) noncol.push('__noncol')
    let important = data.__important || ['account_id'] // required keys to add as column
    let cols = Object.keys(data) || []
    let missingData = []
    important.forEach((col) => {
      if (!cols.includes(col)) missingData.push(col)
    })
    if (missingData.length) return callBack({ detail: `Missing Data: ${missingData}` })
    if (noncol.length)
      noncol.forEach((key) => {
        if (cols.includes(key)) cols.splice(cols.indexOf(key), 1)
      })
    let pg_setvals = []
    let pg_query = `INSERT INTO ${table}(${cols}) VALUES(`
    for (var i = 1; i <= cols.length; i++) {
      pg_query += `$` + i
      if (i != cols.length) pg_query += `, `
      pg_setvals.push(data[cols[i - 1]])
    }
    pg_query += `) RETURNING *;`
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals)
        return callBack(error)
      }
      results.query = queryVars2Vals(pg_query, pg_setvals)
      return callBack(null, results)
    })
  },

  service_view: (data, callBack) => {
    let __colsData = getObj(dbTables(), `${table}.columns`)
    let pg_query = data.count ? `SELECT COUNT(*)` : `SELECT ${data.columns ? data.columns : '*'} FROM ${table}`
    data.pg_query = pg_query
    let { query_cond, query_endstement, query_vals } = queryConditioner(data, __colsData)
    if (data.count) {
      if (query_cond.length) pg_query += ` FILTER (WHERE ${query_cond.join(' AND ')})`
      pg_query += ` FROM ${table}`
    } else {
      if (query_cond.length) pg_query += ` WHERE ${query_cond.join(' AND ')}`
      if (query_endstement.length) pg_query += ` ${query_endstement.join(' ')}`
    }
    let pg_setvals = []
    if (query_vals.length) pg_setvals.push(...query_vals)
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals)
        return callBack(error)
      }
      results.query = queryVars2Vals(pg_query, pg_setvals)
      return callBack(null, results)
    })
  },

  service_updateBySingle: (data, callBack) => {
    let noncol = data.__noncol || ['id', 'userid', '__noncol', '__important', '__toupdate', '__options'] // keys not to include as columns
    if (noncol.length && !noncol.includes('__noncol')) noncol.push('__noncol')
    let important = data.__important || ['__toupdate'] // ["id", "userid", "username"] required keys to add as column
    let cols = Object.keys(data) || []
    let missingData = []
    important.forEach((col) => {
      if (!cols.includes(col)) missingData.push(col)
    })
    if (missingData.length) return callBack({ detail: `Missing Data: ${missingData}` })
    const toupdate = data.__toupdate
    if (noncol.length)
      noncol.forEach((key) => {
        if (cols.includes(key)) cols.splice(cols.indexOf(key), 1)
      })
    let pg_setvals = []
    let pg_query = `UPDATE ${table} SET `
    for (var i = 1; i <= cols.length; i++) {
      pg_query += cols[i - 1] + `=$${i}`
      if (i != cols.length) pg_query += `, `
      pg_setvals.push(data[cols[i - 1]])
    }
    pg_query += ` WHERE ${toupdate.__tokey}=$${cols.length + 1} RETURNING *`
    pg_setvals.push(toupdate.__toval)
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals)
        return callBack(error)
      }
      results.query = queryVars2Vals(pg_query, pg_setvals)
      return callBack(null, results)
    })
  },

  service_deleteBySingle: (data, callBack) => {
    let important = data.__important || ['__toupdate'] // required keys to add as column
    let cols = Object.keys(data) || []
    let missingData = []
    important.forEach((col) => {
      if (!cols.includes(col)) missingData.push(col)
    })
    if (missingData.length) return callBack({ detail: `Missing Data: ${missingData}` })
    const toupdate = data.__toupdate
    let pg_setvals = [toupdate.__toval]
    let pg_query = `DELETE FROM ${table} WHERE ${toupdate.__tokey}=$1`
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals)
        return callBack(error)
      }
      results.query = queryVars2Vals(pg_query, pg_setvals)
      return callBack(null, results)
    })
  },
}
