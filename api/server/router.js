const { publicDetails, serverInfo, getServerDetails, getDBCType, getDBBranches } = require('./server.controller')

// Add New Route Here
module.exports = [
  {
    methods: ['get'],
    path: '/',
    secure: false,
    handlers: [publicDetails],
  },
  {
    methods: ['get'],
    path: '/info',
    secure: true,
    handlers: [serverInfo],
  },
  {
    methods: ['get'],
    path: '/get',
    secure: true,
    handlers: [getServerDetails],
  },
  {
    methods: ['get'],
    path: '/dbctype',
    secure: false,
    handlers: [getDBCType],
  },
  {
    methods: ['get'],
    path: '/dbubranches',
    secure: false,
    handlers: [getDBBranches],
  },
]
