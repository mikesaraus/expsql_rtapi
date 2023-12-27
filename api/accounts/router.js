const { view, create } = require('./account.controller')

// Add New Route Here
module.exports = [
  {
    methods: ['get'],
    path: '/',
    secure: true,
    handlers: [view],
  },
  {
    methods: ['post'],
    path: '/',
    secure: true,
    handlers: [create],
  },
]
