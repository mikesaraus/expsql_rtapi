const { SendEmail } = require("./mail.services"),
  { errorJsonResponse } = require("../../lib/fn/fn.db");

module.exports = {
  sendMail: (req, res) => {
    const payload = req.body || {};
    console.log("payload", payload);
    SendEmail(payload, (err, success) => {
      if (err) {
        return res.json(errorJsonResponse(err));
      } else {
        return res.json(success);
      }
    });
  },
};
