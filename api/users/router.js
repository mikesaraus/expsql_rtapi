const {
  create,
  view,
  updateByParam0,
  deleteActionByParam0,
  loginWithPassword,
  loginViaToken,
} = require("./user.controller");

// Add New Route Here
module.exports = [
  {
    methods: ["post"],
    path: "/",
    secure: false,
    handlers: [create],
  },
  {
    methods: ["post"],
    path: "/login",
    secure: false,
    handlers: [loginWithPassword],
  },
  {
    methods: ["get", "post"],
    path: "/login/secret",
    secure: false,
    handlers: [loginViaToken],
  },
  {
    methods: ["get"],
    path: "/",
    secure: true,
    handlers: [view],
  },
  {
    methods: ["get"],
    path: "/:userid",
    secure: true,
    handlers: [view],
  },
  {
    methods: ["get"],
    path: "/i/:id",
    secure: true,
    handlers: [view],
  },
  {
    methods: ["get"],
    path: "/u/:username",
    secure: true,
    handlers: [view],
  },
  {
    methods: ["put"],
    path: "/:userid",
    secure: true,
    handlers: [updateByParam0],
  },
  {
    methods: ["put"],
    path: "/i/:id",
    secure: true,
    handlers: [updateByParam0],
  },
  {
    methods: ["put"],
    path: "/u/:username",
    secure: true,
    handlers: [updateByParam0],
  },
  {
    methods: ["delete"],
    path: "/:userid",
    secure: true,
    handlers: [deleteActionByParam0],
  },
  {
    methods: ["delete"],
    path: "/i/:id",
    secure: true,
    handlers: [deleteActionByParam0],
  },
  {
    methods: ["delete"],
    path: "/u/:username",
    secure: true,
    handlers: [deleteActionByParam0],
  },
];
