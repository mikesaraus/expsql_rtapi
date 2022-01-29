const _ = process.env;
const pg = require("pg");

let db_config = {
  host: _.DB_HOST,
  database: _.DB_NAME,
  port: _.DB_PORT,
  user: _.DB_USER,
  password: _.DB_PWD,
};

let pg_client = new pg.Client(db_config);

pg_client.connect((err) => {
  if (err) {
    console.error("Can't connect to database");
    err.status = err.message;
    throw err;
  } else {
    console.log("# Database connection established");
  }
});

module.exports = pg_client;
