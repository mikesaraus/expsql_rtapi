const { generateReceipt } = require("./receipt.controller");

// Add New Route Here
module.exports = [
  {
    methods: ["get"],
    path: "/",
    secure: false,
    handlers: [generateReceipt],
  },
  {
    methods: ["get"],
    path: "/secure",
    secure: true,
    handlers: [generateReceipt],
  },
  {
    methods: ["get"],
    path: "/:trans_id",
    secure: false,
    handlers: [generateReceipt],
  },
];
