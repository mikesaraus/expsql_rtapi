const { view, updateByParam0, create } = require('./company.controller')

// Add New Route Here
module.exports = [
  {
    methods: ['get'],
    path: '/',
    secure: false,
    handlers: [view],
  },
  {
    methods: ['post'],
    path: '/',
    secure: true,
    handlers: [create],
  },
  {
    methods: ['put'],
    path: '/:id',
    secure: true,
    handlers: [updateByParam0],
  },
  {
    methods: ['put'],
    path: '/name/:name',
    secure: true,
    handlers: [updateByParam0],
  },
]
