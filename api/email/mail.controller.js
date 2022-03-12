const { SendEmail } = require('./mail.services'),
  { errorJsonResponse } = require('../../lib/fn/fn.db')

module.exports = {
  sendMail: (req, res) => {
    const payload = req.body || {}
    SendEmail(payload, (err, success) => {
      if (err) {
        console.error('Email Error:', JSON.stringify(payload))
        return res.json(errorJsonResponse(err))
      } else {
        console.log('Email Success:', JSON.stringify(success))
        return res.json(success)
      }
    })
  },
}
