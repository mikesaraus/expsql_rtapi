const { publicDetails } = require("./about.controller");

// Add New Route Here
module.exports = [
  {
    methods: ["get"],
    path: "/",
    secure: false,
    handlers: [publicDetails],
  },
];
