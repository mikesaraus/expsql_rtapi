const { service_create, service_view, service_deleteBySingle, service_updateBySingle } = require('./account.service'),
  _ = process.env,
  { encryptPassword } = require('../../lib/fn/fn.generator'),
  { hideSomeColumns, errorJsonResponse } = require('../../lib/fn/fn.db'),
  getObj = require('lodash.get')

module.exports = {
  create: (req, res) => {
    let hidden_columns = ['accnt_password'] // columns to hide on response
    const data = req.body
    if (data.accnt_password) data.accnt_password = encryptPassword(data.accnt_password)
    let payload = data
    service_create(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err))
      }
      let jres = {
        success: 1,
        data: results ? results.rows[0] || [] : [],
      }
      console.log(
        JSON.stringify({
          command: results ? results.command : '',
          query: results ? results.query : '',
          rowCount: results ? results.rowCount : 0,
          response: jres,
        })
      )
      jres.data = hideSomeColumns(hidden_columns, jres.data)
      return res.json(jres)
    })
  },

  view: (req, res) => {
    let hidden_columns = ['accnt_password'] // columns to hide on response
    let payload = { ...req.params, ...req.query }
    service_view(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err))
      }
      let jres = {
        success: 1,
        data: results ? (results.rowCount ? results.rows : []) : [],
      }
      console.log(
        JSON.stringify({
          command: results ? results.command : '',
          query: results ? results.query : '',
          rowCount: results ? results.rowCount : 0,
          response: jres,
        })
      )
      jres.data = hideSomeColumns(hidden_columns, jres.data)
      return res.json(jres)
    })
  },

  updateByParam0: (req, res) => {
    let hidden_columns = ['accnt_password'] // columns to hide on response
    const __tokey = Object.keys(req.params)[0]
    const __toval = req.params[__tokey]
    const data = req.body
    if (data.accnt_password) data.accnt_password = encryptPassword(data.accnt_password)
    let payload = {
      __toupdate: {
        __tokey: __tokey,
        __toval: __toval,
      },
      ...data,
    }
    service_updateBySingle(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err))
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
        data: results ? results.rows[0] || undefined : undefined,
      }
      console.log(
        JSON.stringify({
          command: results ? results.command : '',
          query: results ? results.query : '',
          rowCount: results ? results.rowCount : 0,
          response: jres,
        })
      )
      jres.data = hideSomeColumns(hidden_columns, jres.data)
      return res.json(jres)
    })
  },

  deleteByParam0: (req, res) => {
    let hidden_columns = [] // columns to hide on response
    const __tokey = Object.keys(req.params)[0]
    const __toval = req.params[__tokey]
    let payload = {
      __toupdate: {
        __tokey: __tokey,
        __toval: __toval,
      },
    }
    service_deleteBySingle(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err))
      }
      let jres = {
        success: results ? (results.rowCount ? 1 : 0) : 0,
      }
      console.log(
        JSON.stringify({
          command: results ? results.command : '',
          query: results ? results.query : '',
          rowCount: results ? results.rowCount : 0,
          response: jres,
        })
      )
      jres.data = hideSomeColumns(hidden_columns, jres.data)
      return res.json(jres)
    })
  },

  deleteActionByParam0: (req, res) => {
    let hidden_columns = ['accnt_password'] // columns to hide on response
    const __tokey = Object.keys(req.params)[0]
    const __toval = req.params[__tokey]
    const verified = req.headers.verified
    if (getObj(verified, 'data.userid')) {
      const data = { status: 'deactivated' }
      let payload = {
        __toupdate: {
          __tokey: __tokey,
          __toval: __toval,
        },
        ...data,
      }
      service_updateBySingle(payload, (err, results) => {
        if (err) {
          return res.json(errorJsonResponse(err))
        }
        let jres = {
          success: results ? (results.rowCount ? 1 : 0) : 0,
          data: results ? results.rows[0] || undefined : undefined,
        }
        console.log(
          JSON.stringify({
            command: results ? results.command : '',
            query: results ? results.query : '',
            rowCount: results ? results.rowCount : 0,
            response: jres,
          })
        )
        jres.data = hideSomeColumns(hidden_columns, jres.data)
        return res.json(jres)
      })
    } else {
      return res.json(errorJsonResponse({ detail: 'Verification error, please try again' }))
    }
  },
}
