'use strict'

const t = require('tap')
const test = t.test
const proxyquire = require('proxyquire')

test('shold work with fastify 1.0.0', t => {
  t.plan(1)
  const { getHeaderFunction } = proxyquire('./../lib/Header', {
    'fastify/package.json': {
      version: '1.0.0'
    }
  })
  
  const reply = {
    _header: {
      test: '_header'
    }
  }

  const getHeader = getHeaderFunction()

  t.equals(getHeader(reply, 'test'), '_header')
})

test('shold work with fastify >=1.1.0', t => {
  t.plan(1)
  const { getHeaderFunction } = proxyquire('./../lib/Header', {
    'fastify/package.json': {
      version: '1.1.0'
    }
  })
  
  const reply = {
    getHeader() {
      return 'getHeader'
    }
  }

  const getHeader = getHeaderFunction()

  t.equals(getHeader(reply, 'test'), 'getHeader')
})

test('shold handle missing fastify', t => {
  t.plan(1)
  const { getHeaderFunction } = proxyquire('./../lib/Header', {
    'fastify/package.json': null
  })
  
  const reply = {
    getHeader() {
      return 'getHeader'
    }
  }

  const getHeader = getHeaderFunction()

  t.equals(getHeader(reply, 'test'), 'getHeader')
})

