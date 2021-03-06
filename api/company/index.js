const router = require('express').Router(),
  { verifyToken } = require('../../auth/token.service'),
  paths = require('./router')

try {
  paths.forEach((_newRoute) => {
    if (_newRoute.secure) _newRoute.handlers.unshift(verifyToken)
    _newRoute.methods.forEach((_method) => {
      router[_method.toLowerCase()](_newRoute.path, _newRoute.handlers)
    })
  })
} catch (e) {
  console.error(JSON.stringify(e))
}

module.exports = router
