'use strict'

const semver = require('semver')

function getHeaderFunction () {
  const version = getFastifyVersion()
  if (!version || semver.satisfies(version, '>=1.1.0')) {
    return getHeader
  } else {
    return _header
  }
}

function getHeader (reply, name) {
  return reply.getHeader(name)
}

function _header (reply, name) {
  return reply._header[name]
}

function getFastifyVersion () {
  try {
    return require('fastify/package.json').version
  } catch (error) {
    return null
  }
}

module.exports = {
  getHeaderFunction
}
