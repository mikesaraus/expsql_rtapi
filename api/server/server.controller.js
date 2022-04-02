const _ = process.env,
  { errorJsonResponse } = require('../../lib/fn/fn.db'),
  service_user = require('../users/user.service'),
  { serviceServerInfo, serviceGetDBCType } = require('./server.service'),
  getObj = require('lodash.get')

module.exports = {
  publicDetails: async (req, res) => {
    serviceServerInfo(req, 'info.datetime', (cerr, cresponse) => {
      let response = cresponse
      if (cerr) return res.json(errorJsonResponse(cerr))
      service_user.service_view({ count: true }, async (err, resp) => {
        if (err) return res.json(errorJsonResponse(err))
        const result = getObj(resp, 'rows', [])[0]
        response.data.setup = result && Number(result.count) === 0 ? true : undefined
        return res.json(response)
      })
    })
  },

  serverInfo: async (req, res) => {
    serviceServerInfo(req, 'info', (err, response) => {
      if (err) return res.json(errorJsonResponse(err))
      return res.json(response)
    })
  },

  getServerDetails: async (req, res) => {
    const data = Object.keys(req.query)
    serviceServerInfo(req, data, (err, response) => {
      if (err) return res.json(errorJsonResponse(err))
      return res.json(response)
    })
  },

  getDBCType: async (req, res) => {
    const data = req.query
    serviceGetDBCType(data, (err, response) => {
      if (err) return res.json(errorJsonResponse(err))
      return res.json(response)
    })
  },

  getDBBranches: async (req, res) => {
    const data = req.query
    service_user.service_view_branches(data, (err, resp) => {
      if (err) return res.json(errorJsonResponse(err))
      const data = getObj(resp, 'rows', [])
        .filter((d) => d && d.branch_location)
        .map((d) => d.branch_location)
      const response = {
        success: 1,
        data: data,
      }
      return res.json(response)
    })
  },
}
