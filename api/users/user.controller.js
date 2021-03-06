const userService = require('./user.service')

const {
    service_create,
    service_view,
    service_viewOptions,
    service_deleteBySingle,
    service_updateBySingle,
  } = require('./user.service'),
  _ = process.env,
  { service_upload } = require('../../lib/uploader'),
  { regex_username } = require('../../lib/fn/fn.patters'),
  { compareSync } = require('bcrypt'),
  { block_keywords } = require('../../lib/data/blocklists'),
  { encryptPassword, base64 } = require('../../lib/fn/fn.generator'),
  { hideSomeColumns, errorJsonResponse } = require('../../lib/fn/fn.db'),
  { signToken, verifyCBPrivatePublicToken } = require('../../auth/token.service'),
  getObj = require('lodash.get')

module.exports = {
  create: (req, res) => {
    let hidden_columns = ['password'] // columns to hide on response
    const data = req.body
    const blklist = _.TXT_USERNAME_BLOCK_LIST ? _.TXT_USERNAME_BLOCK_LIST.replace(/\s/g, '').split(',') || [] : []
    let blklists = block_keywords.concat(blklist.filter((item) => blklist.indexOf(item) < 1))
    if (data.username) data.username = data.username.toLowerCase()
    if (blklists.includes(data.username) || !regex_username.test(data.username)) {
      return res.json(errorJsonResponse({ detail: 'Username Not Allowed' }))
    }
    if (data.password) data.password = encryptPassword(data.password)
    let payload = data
    service_create(payload, (err, results) => {
      if (err) {
        return res.json(errorJsonResponse(err))
      }
      let jres = {
        success: 1,
        token: undefined,
        data: results ? results.rows[0] || [] : [],
      }
      jres.token = signToken(jres.data)
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
    let hidden_columns = ['password'] // columns to hide on response
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
    let hidden_columns = ['password'] // columns to hide on response
    const __tokey = Object.keys(req.params)[0]
    const __toval = req.params[__tokey]
    const data = req.body
    if (data.password) data.password = encryptPassword(data.password)
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

  uploadProfilePicture: (req, res) => {
    const data = req.params
    const verified = req.headers.verified
    if (getObj(verified, 'data.userid') && data.userid) {
      if (verified.data.userid === data.userid || String(verified.data.position).toLowerCase().includes('admin')) {
        const upload_path = `profile/${verified.data.userid}`
        service_upload(
          req,
          upload_path,
          (err, fields, files) => {
            if (err) return res.status(500).json(errorJsonResponse(err))
            let error_files = {},
              success_files = {}
            if (files) {
              const file_names = Object.keys(files)
              file_names.forEach((fn) => {
                if (files[fn].ok) success_files[fn] = files[fn]
                else error_files[fn] = files[fn]
              })
            }

            let jres = {
              success: Object.keys(error_files).length ? 0 : 1,
              data: {
                error: error_files,
                uploaded: success_files,
              },
            }
            console.log('Fields:', JSON.stringify(fields || ''))
            console.log(JSON.stringify(jres))
            return res.status(jres.success ? 200 : 200).json(jres)
          },
          {
            keep_extention: true,
            keep_filename: false,
            create_dir_ifnot_exist: true,
            allowed_ext: ['jpeg', 'jpg', 'png'],
          }
        )
      } else {
        return res.json(errorJsonResponse({ detail: 'Permission Denied!' }))
      }
    } else {
      return res.json(errorJsonResponse({ detail: 'Invalid user!' }))
    }
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
    let hidden_columns = ['password'] // columns to hide on response
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

  logout: (req, res) => {
    let hidden_columns = ['password'] // columns to hide on response
    let __tokey = Object.keys(req.params)[0]
    let __toval = req.params[__tokey]
    const verified = req.headers.verified
    if (getObj(verified, 'data.userid')) {
      if (!__tokey || !__toval) {
        __tokey = 'userid'
        __toval = verified.data.userid
      }
      const data = { active_now: 'no' }
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

  loginWithPassword: (req, res) => {
    let hidden_columns = ['password'] // columns to hide on response
    let data = req.body
    let __kbody = Object.keys(data)
    __kbody.splice(__kbody.indexOf('password'), 1)
    const __tokey = __kbody[0]
    const __toval = data[__tokey]
    let payload = {
      __toupdate: {
        __tokey: __tokey,
        __toval: __toval,
      },
      active_now: 'yes',
      last_login: new Date(),
    }
    let _usr = {}
    _usr[payload.__toupdate.__tokey] = payload.__toupdate.__toval
    service_view(_usr, (v_err, v_results) => {
      if (v_err) {
        return res.json(errorJsonResponse(v_err))
      } else if (v_results && v_results.rowCount) {
        data.password = base64.decode(data.password)
        const checkpwd = compareSync(data.password || '', getObj(v_results, 'rows.0.password', ''))
        if (checkpwd && getObj(v_results, 'rows.0.status', '').toLowerCase() == 'active') {
          service_updateBySingle(payload, (err, results) => {
            if (err) {
              return res.json(errorJsonResponse(err))
            }
            let jres = {
              success: results ? (results.rowCount ? (checkpwd ? 1 : 0) : 0) : 0,
              token: undefined,
              data: results ? (results.rowCount ? (checkpwd ? results.rows[0] : undefined) : undefined) : undefined,
            }
            if (jres.success) {
              jres.token = signToken(jres.data)
            } else {
              jres.error = {
                message: results
                  ? results.rowCount
                    ? checkpwd
                      ? 'Login Successful'
                      : data.password
                      ? 'Invalid Password'
                      : 'Provide a Password'
                    : data.password
                    ? 'Invalid User'
                    : 'Password is Required'
                  : 'Invalid Login',
              }
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
          const usr = getObj(v_results, 'rows.0.status', '')
          let jres = {
            success: 0,
            error: {
              message: data.password
                ? usr && usr == 'active'
                  ? 'Invalid Password'
                  : `Account is ${usr.replace(usr[0], usr[0].toUpperCase())}`
                : 'Password is Required',
              // response: v_results,
            },
          }
          console.log(
            JSON.stringify({
              command: v_results ? v_results.command : '',
              query: v_results ? v_results.query : '',
              rowCount: v_results ? v_results.rowCount : 0,
              response: jres,
            })
          )
          return res.json(jres)
        }
      } else {
        let jres = {
          success: 0,
          error: {
            message: 'Invalid User',
            // response: v_results,
          },
        }
        console.log(
          JSON.stringify({
            command: v_results ? v_results.command : '',
            query: v_results ? v_results.query : '',
            rowCount: v_results ? v_results.rowCount : 0,
            response: jres,
          })
        )
        return res.json(jres)
      }
    })
  },

  loginViaToken: (req, res) => {
    let hidden_columns = ['password'] // columns to hide on response
    let token = req.body
      ? req.method === 'POST'
        ? req.body.token || undefined
        : req.query.token || undefined
      : undefined
    let response
    if (token) {
      let tokenError
      verifyCBPrivatePublicToken(token, (err, result) => {
        if (err) {
          tokenError = errorJsonResponse({
            ...err,
            detail: err && err.expiredAt ? 'Token is Expired' : 'Invalid Token',
            code: -1,
          })
        } else {
          console.log(JSON.stringify(result))
          result.data = hideSomeColumns(hidden_columns, result.data)
          response = { success: 1, ...result }
        }
      })
      if (tokenError) return res.json(tokenError)
    } else {
      return res.json(errorJsonResponse({ detail: 'Token is Required' }))
    }
    if (response && typeof response === 'object' && response.success === 1) {
      let hidden_columns = ['password'] // columns to hide on response
      const userid = response.data.userid
      service_viewOptions({ userid }, (err, results) => {
        if (err) {
          return res.json(errorJsonResponse(err))
        }
        let jres = {
          success: results ? (results.rowCount ? 1 : 0) : 0,
          data: results ? (results.rowCount ? results.rows[0] : undefined) : undefined,
          pkey: response.pkey,
          iat: response.iat * 1000 || undefined,
          exp: response.exp * 1000 || undefined,
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
      return res.json(errorJsonResponse({ detail: 'Invalid Login' }))
    }
  },
}
