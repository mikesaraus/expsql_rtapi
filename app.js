"use strict";

const { log_dirs } = require("./lib/data/db.structures");

require("dotenv").config();
require("./lib/prototype/date.prototype");

const _ = process.env,
  express = require("express"),
  app = express(),
  server = require("http").createServer(app),
  compression = require("compression"),
  cors = require("cors"),
  morgan = require("morgan"),
  helmet = require("helmet"),
  bodyParser = require("body-parser"),
  path = require("path"),
  { createStream } = require("rotating-file-stream"),
  { logFilenameFormat } = require("./lib/fn/fn.format"),
  { throttle, decodeURL } = require("./lib/middleware"),
  { existsSync, rmSync, writeFileSync } = require("fs"),
  { verifyCBPrivatePublicToken, verifyToken } = require("./auth/token.service"),
  {
    errorJsonResponse,
    hideSomeColumns,
    availableTables,
  } = require("./lib/fn/fn.db"),
  { checkConfig, checkCors, checkIfObject } = require("./lib/fn/fn.checker"),
  { generateDatabaseSQL, generateDotEnv } = require("./lib/fn/fn.generator"),
  corsOptions = {
    origin: checkCors.appCorsOption,
    optionsSuccessStatus: 200,
  },
  io = require("socket.io")(server, {
    allowRequest: checkCors.socketAllowRequest,
    cors: checkCors.socketCorsOptions,
    credentials: true,
  }),
  pg_client = require("./config/database");

process.title = _.npm_package_name || process.title;

// Some Middlewares
app
  .use(compression())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cors(corsOptions))
  .use(helmet())
  .use(decodeURL()) // Check URL
  .use(throttle(5 * 1024 * 1024)) // throttling bandwidth
  .disable("x-powered-by");

if (_.npm_lifecycle_event.toLowerCase() != "setup") {
  const logServerInfo = async () => {
    const { getServerInfo } = require("./api/server/server.service");
    const server_info = await getServerInfo();
    const logInnerObj = (from, obj) => {
      if (checkIfObject(obj)) {
        Object.keys(obj).forEach((o) => {
          const current_from = `${from ? from + " > " : ""}${o}`;
          if (checkIfObject(obj[o])) logInnerObj(current_from, obj[o]);
          else if (obj[o]) console.log(`[ ${current_from} ]`, obj[o]);
        });
      }
    };
    logInnerObj(null, server_info);
  };
  logServerInfo();

  // Logging
  if (process.argv.includes("--log")) {
    const appResSend = app.response.send;
    app.response.send = function sendOverWrite(body) {
      appResSend.call(this, body);
      this.__custombody__ = body;
    };
    // Console Log All Request and Response
    morgan.token("res-body", (_req, res) => res.__custombody__ || undefined);
    app.use(
      morgan(
        `[:date[clf]] :remote-addr - :remote-user ":method :url HTTP/:http-version" (:response-time ms) :status :res[content-length] ":referrer" ":user-agent" (Total :total-time ms)
      :res-body`,
        {
          stream: createStream(
            logFilenameFormat(new Date(), null, { end: "access", ext: "log" }),
            {
              interval: "1d",
              path: path.join(__dirname, log_dirs.main, log_dirs.request),
              compress: true,
              //(source, dest) =>
              //  "cat " + source + " | gzip -c9 > " + dest,
            }
          ),
        }
      )
    );
  }
}

// Check if Running on Production
if (!_.NODE_ENV || _.NODE_ENV != "production") {
  require("./lib/fn/fn.nodemon");
  // Save DB Structure
  if (process.argv.includes("--gensql")) {
    const gensqlid = process.argv.indexOf("--gensql");
    const _nextarg = process.argv[gensqlid + 1];
    let sqloc =
      `./` + _nextarg && !_nextarg.startsWith("--")
        ? _nextarg.endsWith(".sql")
          ? _nextarg
          : `${_nextarg}.sql`
        : "database.sql";
    console.log("*".repeat(50));
    if (existsSync(".env") && checkConfig().ok) {
      const _genDBerror = writeFileSync(sqloc, generateDatabaseSQL(), "utf-8");
      if (_genDBerror) {
        console.error({
          status: "Database failed to generate .sql",
          error: write_err,
        });
      } else {
        console.log({
          status: `Database structure saved on ${sqloc}`,
          important:
            "Follow the commands inside .sql file to create database structure",
        });
      }
    } else {
      if (existsSync(sqloc)) rmSync(sqloc);
      console.log({
        status: `Can't generate database structure`,
        important: "Please update .env configuration",
      });
    }
  }
  // Generate dotEnv (.env)
  if (process.argv.includes("--genenv")) {
    const envdir = path.join(__dirname, ".env");
    const _genEnvConf = writeFileSync(envdir, generateDotEnv(), "utf-8");
    if (_genEnvConf) {
      console.error(_genEnvConf);
    } else {
      console.log("~".repeat(50));
      console.log({
        status: "DotEnv (.env) structure generated",
        important: "Modify .env Configuration",
      });
      console.log("~".repeat(50));
      process.exit(0);
    }
  }
} else {
  // Update Token Key Every Version
  _.TOKEN_KEY += `v${_.npm_package_version || ""}`;
  _.TOKEN_KEY_PUB += `v${_.npm_package_version || ""}`;
}

// Static Routes
app.use("/", express.static("./public"));

/*
  API Routes
*/
if (_.npm_lifecycle_event.toLowerCase() != "setup") {
  const api_paths = require("./api");
  try {
    const path_keys = Object.keys(api_paths);
    path_keys.forEach((_newRoute) => {
      const api_path = `/api/${_newRoute}`;
      console.log(`Using ${api_path}`);
      app.use(`${api_path}`, api_paths[_newRoute]);
    });
  } catch (e) {
    console.error(`Error Adding API Path:`, e);
  }
}

/*
  REALTIME LISTENERS
*/
const listeners_apiPath = "/db/listeners",
  notif_activities = {};

const db_tables = availableTables();
if (Array.isArray(db_tables))
  db_tables.forEach((tbl) => {
    notif_activities[tbl] = [
      `added_${tbl}`,
      `updated_${tbl}`,
      `deleted_${tbl}`,
    ];
  });

const notifChannels = checkIfObject(notif_activities)
  ? Object.values(notif_activities).join().split(",")
  : notif_activities;

app.get(listeners_apiPath, (req, res) => {
  return res.json({
    success: 1,
    listeners: { channel: notifChannels },
    required: {
      token: true,
      channel: false,
    },
  });
});

app.post(listeners_apiPath, verifyToken, (req, res) => {
  let data = req.body;
  if (data.to) {
    data.from =
      req.headers.verified &&
      req.headers.verified.data &&
      req.headers.verified.data.userid
        ? req.headers.verified.data.userid
        : req.headers.verified;
    if (!isNaN(data.from)) data.from = Number(data.from);
    if (!isNaN(data.to)) data.to = Number(data.to);
    data.date = new Date();
    pg_client.emit("message", data);
    res.json({
      success: 1,
      data: { message: "Payload sent", payload: data },
    });
  } else {
    res.json(errorJsonResponse({ detail: "Missing Payload Destination (to)" }));
  }
});

// Listen
notifChannels.forEach((activity) => {
  pg_client.query(`LISTEN ${activity}`);
});

// REALTIME NOTIFICATIONS
io.sockets.on("connection", (socket) => {
  // someone successfully connects
  console.log(
    `[${socket.server.engine.clientsCount}] (${socket.handshake.address}) is listening for notifications`
  );
  // someone disconnects
  socket.on("disconnect", () => {
    console.log(
      `[ X ] (${socket.handshake.address}) stopped listening for notifications`
    );
    console.log(
      `[${socket.server.engine.clientsCount}] active notification listener`
    );
  });

  socket.emit("connected", { success: 1 });

  socket.on("RealtimeUpdates", (options) => {
    validateSocketToken(options);
  });

  async function validateSocketToken(options) {
    if (options && checkIfObject(options) && options.token) {
      verifyCBPrivatePublicToken(options.token, (err, result) => {
        let hidden_columns = ["password"];
        if (err) {
          let errjson = {
            error: -1,
            message: "Notications Blocked",
            detail: "Invalid Token",
          };
          console.log(
            `[ X ] (${socket.handshake.address}) ${errjson.message} [ ${errjson.detail} ]`
          );
          socket.emit("error", errjson);
        } else {
          console.log(
            `[ / ] ( ${socket.handshake.address} uid=${
              result && result.data ? result.data.userid || 0 : 0
            }) Ready for Notifications`
          );
          // Personal Notifications
          pg_client.on("message", (message) => {
            socket.emit(message.to == "all" ? "message" : message.to, message);
            if (socket.connected)
              console.log(
                `Custom Notification (${socket.handshake.address}):`,
                message
              );
          });
          // Database Notifications
          pg_client.on("notification", (notif) => {
            if (notif && checkIfObject(notif.payload))
              notif.payload = JSON.stringify(notif.payload);
            const pl = JSON.parse(notif.payload);
            if (notif && pl) {
              let payload = {
                channel: notif.channel,
                when: pl.when,
                operation: pl.operation,
                args: pl.args,
                record: hideSomeColumns(hidden_columns, pl.record),
                record_old: hideSomeColumns(hidden_columns, pl.record_old),
              };

              Object.keys(notif_activities).forEach((_nk) => {
                if (notif.channel.includes(`_${_nk}`)) {
                  payload.channel = String(payload.channel)
                    .replace(`_${_nk}`, "")
                    .toLowerCase();
                  socket.emit(`${_nk}_notif`, payload);
                }
              });

              // Listen to all via notif
              socket.emit("notif", payload);
              if (socket.connected)
                console.log(
                  `Database Notification [${notif.channel}] (${socket.handshake.address}):`,
                  notif
                );
            } else {
              console.log("UNKNOWN: Notification Received", notif);
            }
          });
        }
      });
    } else {
      let errjson = {
        message: "Notifications Disabled",
        detail: options
          ? options.token
            ? "Unknown Error"
            : "Token is Required"
          : "Options is Required",
        help: { url: listeners_apiPath },
      };
      console.log(
        `[ X ] (${socket.handshake.address}) ${errjson.message} [ ${errjson.detail} ]`
      );
      socket.emit("error", errjson);
    }
  }
});

// Bad Requests
app.use((req, res) => {
  console.error("Invalid Endpoint:", { url: req.url, method: req.method });
  return res
    .status(500)
    .json(errorJsonResponse({ detail: "Invalid Endpoint" }));
});

// Error Response
app.use((req, res) => {
  console.error("Server Error:", {
    url: req.url,
    method: req.method,
  });
  return res.status(500).json(errorJsonResponse({ detail: "Server Error" }));
});

if (_.npm_lifecycle_event.toLowerCase() != "setup")
  server.listen(process.env.PORT || _.SRV_MAIN_PORT, () => {
    console.log("#".repeat(50));
    console.log(
      `Server is up and running on *:${process.env.PORT || _.SRV_MAIN_PORT}`
    );
    console.log("#".repeat(50));
  });
