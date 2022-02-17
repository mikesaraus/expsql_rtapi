const _ = process.env;
const { errorJsonResponse } = require("../../lib/fn/fn.db");
const { serviceServerInfo } = require("./server.service");

module.exports = {
  publicDetails: async (req, res) => {
    serviceServerInfo("info.datetime", (err, response) => {
      if (err) return res.json(errorJsonResponse(err));
      return res.json(response);
    });
  },

  serverInfo: async (req, res) => {
    serviceServerInfo("info", (err, response) => {
      if (err) return res.json(errorJsonResponse(err));
      return res.json(response);
    });
  },

  getServerDetails: async (req, res) => {
    const data = Object.keys(req.query);
    serviceServerInfo(data, (err, response) => {
      if (err) return res.json(errorJsonResponse(err));
      return res.json(response);
    });
  },
};
