const _ = process.env,
  { decode } = require("../lib/fn/fn.generator").base64;

const config = {
  IsSMTP: true,
  SMTPDebug: 0,
  SMTPAuth: true,
  SMTPSecure: "ssl",
  Host: "mail.tppainc.com",
  Port: 465,
  Name: "Trans Pilipinas",
  Username: "payments@tppainc.com",
  Password: decode("JFRyYW5zLlBoJA=="),
};

module.exports = { config };
