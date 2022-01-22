"use strict";

require("dotenv").config();
require("./lib/fn/fn.nodemon");
require("./lib/prototype/date.prototype");

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const pg_client = require("./config/database");

const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const path = require("path");
const rfs = require("rotating-file-stream");
const fs = require("fs");

const _ = process.env;
const { verifyCBPrivatePublicToken } = require("./auth/token.service");
const { errorJsonResponse, hideSomeColumns } = require("./lib/fn/fn.db");
const {
  generateDatabaseSQL,
  generateDotEnv,
} = require("./lib/fn/fn.generator");

process.title = _.npm_package_name || process.title;

// Server and Security
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'self' blob: data: gap:; style-src * 'self' 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * 'self' 'unsafe-inline' blob: data: gap:; connect-src 'self' * 'unsafe-inline' blob: data: gap:; frame-src * 'self' blob: data: gap:;"
  );
  try {
    decodeURIComponent(req.path);
  } catch (err) {
    console.error("URL Format Error", err);
    return res.json({
      success: 0,
      error: {
        message: "URL Format Error",
      },
    });
  }
  next();
});

if (_.npm_lifecycle_event != "setup") console.log(process);

if (process.argv.includes("--log")) {
  // Console Log
  const appResSend = app.response.send;
  app.response.send = function sendOverWrite(body) {
    appResSend.call(this, body);
    this.__custombody__ = body;
  };
  morgan.token("res-body", (_req, res) => res.__custombody__ || undefined);
  app.use(
    morgan(
      `[:date[clf]] :remote-addr - :remote-user ":method :url HTTP/:http-version" (:response-time ms) :status :res[content-length] ":referrer" ":user-agent" (Total :total-time ms)`
    )
  );
  // HTTP Requests Log
  app.use(
    morgan(
      `[:date[clf]] :remote-addr - :remote-user ":method :url HTTP/:http-version" (:response-time ms) :status :res[content-length] ":referrer" ":user-agent" (Total :total-time ms)
    :res-body`,
      {
        stream: rfs.createStream(
          () => {
            const fn = (n) => String(n).padStart(2, 0);
            const time = new Date();
            const yearmonth = [
              time.getUTCFullYear(),
              fn(time.getUTCMonth() + 1),
            ].join("");
            const day = fn(time.getUTCDate());
            return `${yearmonth}/${yearmonth}${day}-access.log`;
          },
          {
            interval: _.LOG_INTERVAL || "1d",
            path: path.join(__dirname, "log"),
          }
        ),
      }
    )
  );
}

// Check if Running on Production
if (!_.NODE_ENV || _.NODE_ENV != "production") {
  // Save DB Structure
  if (process.argv.includes("--gensql")) {
    const gensqlid = process.argv.indexOf("--gensql");
    let sqloc =
      process.argv[gensqlid + 1] && !process.argv[gensqlid + 1].startsWith("--")
        ? process.argv[gensqlid + 1]
        : "database.sql";
    fs.writeFile(sqloc, generateDatabaseSQL(), "utf-8", (write_err) => {
      console.log("-".repeat(50));
      if (write_err) {
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
      console.log("-".repeat(50));
    });
  }
  // Generate dotEnv (.env)
  if (process.argv.includes("--genenv")) {
    const envdir = path.join(__dirname, ".env");
    fs.writeFile(envdir, generateDotEnv(), "utf-8", (write_err) => {
      if (write_err) {
        console.error(write_err);
      } else {
        console.log("!".repeat(50));
        console.log({
          status: "DotEnv (.env) Saved",
          important: "Modify .env Configuration",
        });
        console.log("!".repeat(50));
        process.exit(0);
      }
    });
  }
} else {
  // Update Token Key Every Version
  _.TOKEN_KEY += `v${_.npm_package_version || ""}`;
  _.TOKEN_KEY_PUB += `v${_.npm_package_version || ""}`;
}

// Static Routes
app.use("/", express.static("./public"));
app.use("/test", express.static("./test"));

/*
  API Routes
*/
const api_paths = require("./api");
try {
  const path_keys = Object.keys(api_paths);
  path_keys.forEach((_newRoute) => {
    console.log(`Using /api/${_newRoute}`);
    app.use(`/api/${_newRoute}`, api_paths[_newRoute]);
  });
} catch (e) {
  console.error(`Error Adding API Path:`, e);
}

/*
  REALTIME LISTENERS
*/
const listeners_help_api = "/db/listeners";
const notif_activities = [
  "added_user",
  "updated_user",
  "deleted_user",
  "added_transaction",
  "updated_transaction",
  "deleted_transaction",
];

app.get(listeners_help_api, (req, res) => {
  return res.json({
    success: 1,
    listeners: { channel: notif_activities, count: notif_activities.length },
    required: {
      token: true,
      channel: true,
    },
  });
});

// Listen
notif_activities.forEach((activity) => {
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
    if (
      options &&
      typeof options === "object" &&
      options.channel &&
      options.token
    ) {
      verifyCBPrivatePublicToken(options.token, (err, result) => {
        let hidden_columns = ["password"];
        if (err) {
          let errjson = {
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
              result.data.userid || 0
            }) Ready for Notifications`
          );
          pg_client.on("notification", (notif) => {
            if (notif) {
              const pl = JSON.parse(notif.payload);
              let payload = {
                channel: notif.channel,
                when: pl.when,
                operation: pl.operation,
                args: pl.args,
                record: hideSomeColumns(
                  hidden_columns,
                  pl.record,
                  Array.isArray(pl.record)
                ),
                record_old: hideSomeColumns(
                  hidden_columns,
                  pl.record_old,
                  Array.isArray(pl.record)
                ),
              };
              if (options.channel == notif.channel) {
                console.log(
                  `Notification Sent [${notif.channel}] (${
                    socket.handshake.address
                  } uid=${result.data.userid || 0}):`,
                  notif
                );
                socket.emit(notif.channel, payload);
              } else if (String(options.channel).toLowerCase() === "all") {
                console.log(
                  `Notification Sent [${notif.channel}] ( ${
                    socket.handshake.address
                  } uid=${result.data.userid || 0}):`,
                  notif
                );
                socket.emit("notif", payload);
              }
            } else {
              console.log("Received Empty Notification");
            }
          });
        }
      });
    } else {
      let errjson = {
        message: "Notifications Disabled",
        detail: options
          ? options.token
            ? options.channel
              ? "Unknown Error"
              : "Channel is Required"
            : "Token is Required"
          : "Token and Channel is Required",
        help: { url: listeners_help_api },
      };
      console.log(
        `[ X ] (${socket.handshake.address}) ${errjson.message} [ ${errjson.detail} ]`
      );
      socket.emit("error", errjson);
    }
  });
});

// Bad Requests
app.use((req, res) => {
  console.error("Invalid Endpoint:", { url: req.url, method: req.method });
  return res.status(500).json(errorJsonResponse(undefined, "Invalid Endpoint"));
});

// Error Response
app.use((err, req, res) => {
  console.error("Server Error:", {
    url: req.url,
    method: req.method,
    error: err,
  });
  return res.status(500).json(errorJsonResponse(undefined, "Server Error"));
});

if (_.npm_lifecycle_event != "setup")
  server.listen(process.env.PORT || _.SRV_MAIN_PORT, () => {
    console.log(
      `Server is up and running on *: ${process.env.PORT || _.SRV_MAIN_PORT}`
    );
  });