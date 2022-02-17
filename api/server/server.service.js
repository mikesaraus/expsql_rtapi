const _ = process.env;
const drivelist = require("drivelist");
const os = require("os");
const { envVars } = require("../../lib/data/db.structures");
const { whitelistServers } = require("../../lib/fn/fn.checker");
const getObj = require("lodash.get");

const getServerInfo = async () => {
  const os_info = [
    "arch",
    "cpus",
    "endianness",
    "freemem",
    "homedir",
    "hostname",
    "loadavg",
    "networkInterfaces",
    "platform",
    "release",
    "tmpdir",
    "totalmem",
    "type",
    "userInfo",
    "uptime",
    "version",
  ];

  /**
   * Server Info
   */
  let server = {
    info: {
      datetime: null,
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
      domain: process.domain,
      api: {
        port: _.SRV_MAIN_PORT,
        allowed_host: whitelistServers,
      },
      module_versions: process.versions,
      argv: process.argv,
      env_config: {},
      features: process.features,
    },
  };

  envVars.forEach((v) => {
    server.process.env_config[v] = _[v];
  });

  const local_date = new Date();
  server.info.datetime = local_date.setHours(
    local_date.getHours(),
    local_date.getMinutes(),
    local_date.getSeconds() + 3,
    local_date.getMilliseconds()
  );

  os_info.forEach((info) => {
    if (os[info]) {
      server.info.os[info] = os[info]();
    }
  });

  const drives = await drivelist.list();
  drives.forEach((drive) => {
    server.info.drives.push(drive);
  });

  return server;
};

module.exports = {
  getServerInfo,

  serviceServerInfo: async (data, callBack) => {
    const server = await getServerInfo();
    let response = {
      success: 1,
      data: {},
    };
    if (data === undefined) response = server;
    else if (Array.isArray(data)) {
      data.forEach((d) => {
        if (getObj(server, d))
          response.data[d.replaceAll(".", "_")] = getObj(server, d);
      });
    } else response.data[data.replaceAll(".", "_")] = getObj(server, data);
    callBack(null, response);
  },
};
