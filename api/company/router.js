const { view, updateByParam0 } = require("./company.controller");

// Add New Route Here
module.exports = [
  {
    methods: ["get"],
    path: "/",
    secure: false,
    handlers: [view],
  },
  {
    methods: ["put"],
    path: "/:id",
    secure: true,
    handlers: [updateByParam0],
  },
  {
    methods: ["put"],
    path: "/name",
    secure: true,
    handlers: [updateByParam0],
  },
];
