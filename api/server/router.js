const {
  publicDetails,
  serverInfo,
  getServerDetails,
} = require("./server.controller");

// Add New Route Here
module.exports = [
  {
    methods: ["get"],
    path: "/",
    secure: false,
    handlers: [publicDetails],
  },
  {
    methods: ["get"],
    path: "/info",
    secure: true,
    handlers: [serverInfo],
  },
  {
    methods: ["get"],
    path: "/get",
    secure: true,
    handlers: [getServerDetails],
  },
];
