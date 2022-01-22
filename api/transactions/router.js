const {
  create,
  view,
  updateByParam0,
  deleteByParam0,
  viewSummary,
  viewReport,
} = require("./trans.controller");

// Add New Route Here
module.exports = [
  {
    methods: ["post"],
    path: "/",
    secure: true,
    handlers: [create],
  },
  {
    methods: ["get"],
    path: "/",
    secure: true,
    handlers: [view],
  },
  {
    methods: ["get"],
    path: "/summary",
    secure: true,
    handlers: [viewSummary],
  },
  {
    methods: ["get"],
    path: "/report",
    secure: true,
    handlers: [viewReport],
  },
  {
    methods: ["get"],
    path: "/:trans_id",
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
    path: "/or/:trans_or",
    secure: true,
    handlers: [view],
  },
  {
    methods: ["get"],
    path: "/ar/:trans_ar",
    secure: true,
    handlers: [view],
  },
  {
    methods: ["put"],
    path: "/:trans_id",
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
    path: "/or/:trans_or",
    secure: true,
    handlers: [updateByParam0],
  },
  {
    methods: ["put"],
    path: "/ar/:trans_ar",
    secure: true,
    handlers: [updateByParam0],
  },
  {
    methods: ["delete"],
    path: "/:trans_id",
    secure: true,
    handlers: [deleteByParam0],
  },
  {
    methods: ["delete"],
    path: "/i/:id",
    secure: true,
    handlers: [deleteByParam0],
  },
  {
    methods: ["delete"],
    path: "/or/:trans_or",
    secure: true,
    handlers: [deleteByParam0],
  },
  {
    methods: ["delete"],
    path: "/ar/:trans_ar",
    secure: true,
    handlers: [deleteByParam0],
  },
];
