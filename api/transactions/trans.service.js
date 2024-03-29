const _ = process.env,
  { pg_client } = require('../../config').database,
  { dbTables } = require('../../lib/data/db.structures'),
  accounts = require('../accounts/account.service'),
  { queryVars2Vals, queryConditioner } = require('../../lib/fn/fn.db'),
  { generateTransactionID } = require('../../lib/fn/fn.generator'),
  { errorJsonResponse } = require('../../lib/fn/fn.db'),
  getObj = require('lodash.get')
// db table
const table = _.DBTBL_TRANSACTIONS
const create_account = accounts.service_create

module.exports = {
  service_create: (data, callBack) => {
    let noncol = data.__noncol || ['trans_id'] // keys not to include as columns
    if (noncol.length && !noncol.includes('__noncol')) noncol.push('__noncol')
    let important = data.__important || [
      'account_id',
      'receiver_id',
      'branch_location',
      'paymethod',
      'channel',
      'amount_paid',
      'amount_received',
    ] // required keys to add as column
    let cols = Object.keys(data) || []
    let missingData = []
    important.forEach((col) => {
      if (!cols.includes(col)) missingData.push(col)
    })
    if (missingData.length) return callBack({ detail: 'Missing Data: ' + missingData })
    if (noncol.length)
      noncol.forEach((key) => {
        if (cols.includes(key)) cols.splice(cols.indexOf(key), 1)
      })
    if (!data.exist)
      create_account({ account_id: data.account_id, account_name: data.account_name }, (err, results) => {
        if (err) {
          console.log('Failed Adding New Account:', errorJsonResponse(err))
        }
        let jres = {
          success: 1,
          data: results ? results.rows[0] || [] : [],
        }
        console.log(
          'New Account Added:',
          JSON.stringify({
            command: results ? results.command : '',
            query: results ? results.query : '',
            rowCount: results ? results.rowCount : 0,
            response: jres,
          })
        )
      })
    let pg_setvals = []
    const trans_id = generateTransactionID()
    let pg_query = `INSERT INTO ${table} (trans_id, ${cols}) VALUES(${trans_id},`
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
    let noncol = data.__noncol || ['id', 'receiver_id', 'trans_id', '__important', '__toupdate', '__options'] // keys not to include as columns
    if (noncol.length && !noncol.includes('__noncol')) noncol.push('__noncol')
    let important = data.__important || ['__toupdate'] // required keys to add as column
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

  service_viewSummary: (data, callBack) => {
    let __colsData = getObj(dbTables(), `${table}.columns`)
    let _selections_count = [
      `COUNT(amount_paid) as count_overall`,
      `COALESCE(SUM(CASE WHEN TO_CHAR(date_paid,'YYYY')=TO_CHAR(CURRENT_TIMESTAMP,'YYYY') THEN 1 ELSE 0 END),0) as count_thisyear`,
      `COALESCE(SUM(CASE WHEN TO_CHAR(date_paid,'YYYY-MM')=TO_CHAR(CURRENT_TIMESTAMP,'YYYY-MM') THEN 1 ELSE 0 END),0) as count_thismonth`,
      `COALESCE(SUM(CASE WHEN TO_CHAR(date_paid, 'YYYY-MM-DD')=TO_CHAR(CURRENT_TIMESTAMP,'YYYY-MM-DD') THEN 1 ELSE 0 END),0) as count_thisday`,
    ]
    let _selections_total = [
      `COALESCE(SUM(amount_paid),0) as total_overall`,
      `COALESCE(SUM(CASE WHEN TO_CHAR(date_paid,'YYYY')=TO_CHAR(CURRENT_TIMESTAMP,'YYYY') THEN amount_paid ELSE 0 END),0) as total_thisyear`,
      `COALESCE(SUM(CASE WHEN TO_CHAR(date_paid,'YYYY-MM')=TO_CHAR(CURRENT_TIMESTAMP,'YYYY-MM') THEN amount_paid ELSE 0 END),0) as total_thismonth`,
      `COALESCE(SUM(CASE WHEN TO_CHAR(date_paid, 'YYYY-MM-DD')=TO_CHAR(CURRENT_TIMESTAMP,'YYYY-MM-DD') THEN amount_paid ELSE 0 END),0) as total_thisday`,
    ]
    const _channels = ['OverTheCounter', 'Internet', 'Mobile', 'ATM', 'Phone']
    _channels.forEach((channel) => {
      _selections_count.push(
        `COALESCE(SUM(CASE WHEN channel='${channel}' THEN 1 ELSE 0 END), 0) as count_channel_${channel.replaceAll(
          '.',
          ''
        )}`
      )
      _selections_total.push(
        `COALESCE(SUM(CASE WHEN channel='${channel}' THEN amount_paid ELSE 0 END), 0) as total_channel_${channel.replaceAll(
          '.',
          ''
        )}`
      )
    })
    const _channels_online = ['Gcash', 'Coins.ph', 'Paymaya', 'Debit']
    _channels_online.forEach((channel) => {
      _selections_count.push(
        `COALESCE(SUM(CASE WHEN channel_online='${channel}' THEN 1 ELSE 0 END), 0) as count_online_${channel.replaceAll(
          '.',
          ''
        )}`
      )
      _selections_total.push(
        `COALESCE(SUM(CASE WHEN channel_online='${channel}' THEN amount_paid ELSE 0 END), 0) as total_online_${channel.replaceAll(
          '.',
          ''
        )}`
      )
    })
    const _paymethod = ['Cash', 'Check', 'Debit']
    _paymethod.forEach((paymod) => {
      _selections_count.push(
        `COALESCE(SUM(CASE WHEN paymethod='${paymod}' THEN 1 ELSE 0 END), 0) as count_paymethod_${paymod.replaceAll(
          '.',
          ''
        )}`
      )
      _selections_total.push(
        `COALESCE(SUM(CASE WHEN paymethod='${paymod}' THEN amount_paid ELSE 0 END), 0) as total_paymethod_${paymod.replaceAll(
          '.',
          ''
        )}`
      )
    })
    let pg_query = `SELECT ${[_selections_count.join(', '), _selections_total.join(', ')].join(', ')} FROM
      ${table}`
    data.pg_query = pg_query
    let { query_cond, query_endstement, query_vals } = queryConditioner(data, __colsData)
    if (query_cond.length) pg_query += ` WHERE ${query_cond.join(' AND ')}`
    if (query_endstement.length) pg_query += ` ${query_endstement.join(' ')}`
    let pg_setvals = []
    if (query_vals.length) pg_setvals.push(...query_vals)
    pg_client.query(pg_query, pg_setvals, (error, results) => {
      if (error) {
        error.query = queryVars2Vals(pg_query, pg_setvals)
        return callBack(error)
      }
      results.query = queryVars2Vals(pg_query, pg_setvals)
      if (results.rowCount) {
        const _r = results.rows[0]
        let mod_rows = {
          count: {
            paymethod: {},
            channel: {},
            online: {},
          },
          total_paid: {
            paymethod: {},
            channel: {},
            online: {},
          },
        }
        let _rkeys = Object.keys(_r)
        _rkeys.forEach((key) => {
          if (key.startsWith('count_')) {
            let _nk = key.replace('count_', '')
            if (_nk.startsWith('paymethod_')) {
              mod_rows.count.paymethod[_nk.replace('paymethod_', '')] = _r[key]
            } else if (_nk.startsWith('channel_')) {
              mod_rows.count.channel[_nk.replace('channel_', '')] = _r[key]
            } else if (_nk.startsWith('online_')) {
              mod_rows.count.online[_nk.replace('online_', '')] = _r[key]
            } else {
              mod_rows.count[_nk] = _r[key]
            }
          } else if (key.startsWith('total_')) {
            let _nk = key.replace('total_', '')
            if (_nk.startsWith('paymethod_')) {
              mod_rows.total_paid.paymethod[_nk.replace('paymethod_', '')] = _r[key]
            } else if (_nk.startsWith('channel_')) {
              mod_rows.total_paid.channel[_nk.replace('channel_', '')] = _r[key]
            } else if (_nk.startsWith('online_')) {
              mod_rows.total_paid.online[_nk.replace('online_', '')] = _r[key]
            } else {
              mod_rows.total_paid[_nk] = _r[key]
            }
          } else {
            mod_rows[key] = _r[key]
          }
        })
        results.rows[0] = mod_rows
      }
      return callBack(null, results)
    })
  },

  service_viewReport: (data, callBack) => {
    let __colsData = getObj(dbTables(), `${table}.columns`)
    let columns = data.groupby ? data.groupby.split('||') : ['branch_location']
    data.groupby = columns.join('||')
    let pg_query = `SELECT ${columns.join(', ')}`
    let _algo_sum = data.sum ? data.sum.split('||') : ['amount_paid']
    let _algo_count = data.count ? data.count.split('||') : ['trans_id']
    _algo_sum.forEach((_algo) => {
      pg_query += `, SUM(${_algo})::numeric AS sum_${_algo}`
    })
    _algo_count.forEach((_algo) => {
      let _aval = _algo.startsWith(':u:') ? _algo.replace(':u:', '') : _algo
      pg_query += `, COUNT(${_algo.startsWith(':u:') ? `DISTINCT ${_aval}` : _aval})::numeric AS count_${_aval}`
    })
    data.pg_query = pg_query
    let { query_cond, query_endstement, query_vals } = queryConditioner(data, __colsData)
    pg_query += ` FROM ${table}`
    if (query_cond.length) pg_query += ` WHERE ${query_cond.join(' AND ')}`
    if (query_endstement.length) pg_query += ` ${query_endstement.join(' ')}`
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
}
