'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const request = require('request')
const fastifyCompression = require('..')
const brotli = require('iltorb')
const semver = require('semver')
const zlib = require('zlib')

test('should compress with brotli if larger than threshold', t => {
  t.plan(6)

  const fastify = Fastify()

  const options = {
    threshold: 8,
    brotli
  }
  fastify.register(fastifyCompression, options)
  fastify.get('/', (request, reply) => {
    reply.send('something larger than threshold')
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      headers: {
        'accept-encoding': 'br'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.notOk(response.headers['content-length'])
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'br')
      t.strictEqual(brotli.decompressSync(body).toString('utf-8'), 'something larger than threshold')
    })
  })
})

test('should compress with node core brotli if node version >= 11.7.0', t => {
  const useNativeBrotli = semver.satisfies(process.version, '>=11.7.0')

  if (useNativeBrotli) {
    t.plan(6)
  
    const fastify = Fastify()
  
    const options = {
      threshold: 8
    }
    fastify.register(fastifyCompression, options)
    fastify.get('/', (request, reply) => {
      reply.send('something larger than threshold')
    })
    fastify.listen(0, err => {
      fastify.server.unref()
      t.error(err)
      request({
        method: 'GET',
        uri: 'http://localhost:' + fastify.server.address().port,
        headers: {
          'accept-encoding': 'br'
        },
        encoding: null
      }, (err, response, body) => {
        t.error(err)
        t.notOk(response.headers['content-length'])
        t.strictEqual(response.statusCode, 200)
        t.strictEqual(response.headers['content-encoding'], 'br')
        t.strictEqual(zlib.brotliDecompressSync(body).toString('utf-8'), 'something larger than threshold')
      })
    })
  } else {
    t.plan(0)
  }
})