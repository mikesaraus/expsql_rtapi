const _ = process.env,
  { decode } = require('../lib/fn/fn.generator').base64,
  pg = require('pg')

const config = {
  host: _.DB_HOST,
  database: _.DB_NAME,
  port: _.DB_PORT,
  user: _.DB_USER,
  password: decode(_.DB_PWD),
}
const pg_client = new pg.Client(config)

pg_client.connect((err) => {
  if (err) {
    if (_.npm_lifecycle_event && _.npm_lifecycle_event.toLowerCase() != 'setup')
      console.error("Can't connect to database")
    err.status = err.message
    throw err
  } else {
    if (_.npm_lifecycle_event && _.npm_lifecycle_event.toLowerCase() != 'setup')
      console.log('# Database connection established')
  }
})

module.exports = { config, pg_client }
