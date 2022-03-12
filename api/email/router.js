const { sendMail } = require('./mail.controller')

// Add New Route Here
module.exports = [
  {
    methods: ['post'],
    path: '/',
    secure: false,
    handlers: [sendMail],
  },
]
