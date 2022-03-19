const _ = process.env,
  nodemailer = require('nodemailer'),
  { decode } = require('../../lib/fn/fn.generator').base64
// Create mail transporter
const transporter = nodemailer.createTransport({
  name: _.MAIL_NAME,
  host: _.MAIL_HOST,
  port: _.MAIL_PORT,
  auth: {
    user: _.MAIL_AUTH_USER,
    pass: decode(_.MAIL_AUTH_PWD),
  },
})

module.exports = {
  SendEmail: (data, callback) => {
    let mailOptions = {
      from: data.from,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    }
    transporter.verify((err, success) => {
      if (err) {
        callback(err)
      } else {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            callback(error)
          } else {
            callback(null, info)
          }
        })
      }
    })
    module.exports.CloseEmailConnection((e) => {
      if (e) console.error('Failed Clossing Email Connection:', JSON.stringify(e))
    })
  },

  CloseEmailConnection: (callback) => {
    try {
      transporter.close()
      callback(null, true)
    } catch (error) {
      callback(error)
    }
  },
}
