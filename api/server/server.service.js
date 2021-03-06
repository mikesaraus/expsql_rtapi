const _ = process.env,
  drivelist = require('drivelist'),
  os = require('os'),
  { envVars, dbTables } = require('../../lib/data/db.structures'),
  { whitelistServers } = require('../../lib/fn/fn.checker').checkCors,
  getObj = require('lodash.get'),
  isOnline = require('../../lib/fn/fn.isonline')

const getServerInfo = async () => {
  const os_info = [
    'arch',
    'cpus',
    'endianness',
    'freemem',
    'homedir',
    'hostname',
    'loadavg',
    'networkInterfaces',
    'platform',
    'release',
    'tmpdir',
    'totalmem',
    'type',
    'userInfo',
    'uptime',
    'version',
  ]

  /**
   * Server Info
   */
  let server = {
    info: {
      datetime: null,
      starttime: Number(_.starttime),
      os: {},
      drives: [],
    },

    process: {
      title: process.title,
      pid: process.pid,
      ppid: process.ppid,
      debugPort: process.debugPort,
      environment: _.NODE_ENV,
      init_cwd: _.INIT_CWD,
      api: {
        port: _.SRV_MAIN_PORT,
        allowed_host: whitelistServers,
      },
      module_versions: process.versions,
      argv: process.argv,
      env_config: {},
      features: process.features,
    },
  }

  envVars.forEach((v) => {
    server.process.env_config[v] = _[v]
  })

  const local_date = new Date()
  server.info.datetime = local_date.setHours(
    local_date.getHours(),
    local_date.getMinutes(),
    local_date.getSeconds() + 3,
    local_date.getMilliseconds()
  )

  os_info.forEach((info) => {
    if (os[info]) {
      server.info.os[info] = os[info]()
    }
  })

  const drives = await drivelist.list()
  drives.forEach((drive) => {
    server.info.drives.push(drive)
  })

  server.info.isOnline = await isOnline({
    timeout: 250,
    retries: 1,
  })
    .then(() => {
      return true
    })
    .catch(() => {
      return false
    })

  return server
}

module.exports = {
  getServerInfo,

  serviceServerInfo: async (req, data, callBack) => {
    const server = await getServerInfo()
    let response = {
      success: 1,
      data: {},
    }
    if (data === undefined) response.data = server
    else if (Array.isArray(data)) {
      data.forEach((d) => {
        if (getObj(server, d)) response.data[d.replaceAll('.', '_')] = getObj(server, d)
      })
    } else response.data[data.replaceAll('.', '_')] = getObj(server, data)
    if (req)
      response.data.req_url = `http${getObj(req, 'secure') ? 's' : ''}://${getObj(req, 'headers.host')}${getObj(
        req,
        'client.parser.incoming.baseUrl',
        ''
      )}`
    callBack(null, response)
  },

  serviceGetDBCType: async (data, callback) => {
    const tbl = dbTables()[data.table]
    if (!tbl) return callback(new Error('Unknown Table'))
    let info
    if (tbl.custom_types && Array.isArray(tbl.custom_types))
      tbl.custom_types.forEach((type, i) => {
        if (type.name == data.type) {
          info = tbl.custom_types[i]
        }
      })
    if (!info) return callback(new Error('Unknown CType'))
    return callback(null, {
      success: 1,
      data: info,
    })
  },
}
