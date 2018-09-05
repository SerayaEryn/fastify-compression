'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const request = require('request')
const fastifyCompression = require('..')
const zlib = require('zlib')

test('register should work', t => {
  t.plan(1)
  const fastify = Fastify()

  const options = {}
  fastify.register(fastifyCompression, options)
  fastify.ready((err) => {
    t.error(err)
  })
})

test('should not compress if smaller than threshold', t => {
  t.plan(4)

  const fastify = Fastify()

  const options = {
    threshold: 8
  }
  fastify.register(fastifyCompression, options)
  fastify.get('/', (request, reply) => {
    reply.send(200)
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      gzip: true
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], undefined)
    })
  })
})

test('should not compress if invalid content-type', t => {
  t.plan(4)

  const fastify = Fastify()

  const options = {
    threshold: 8
  }
  fastify.register(fastifyCompression, options)
  fastify.get('/', (request, reply) => {
    reply.header('Content-Type', 'image/png')
    reply.send('something larger than threshold')
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      gzip: true
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], undefined)
    })
  })
})

test('should set default value for threshold', t => {
  t.plan(6)

  const fastify = Fastify()

  const options = {}
  fastify.register(fastifyCompression, options)

  let aLongString = ''
  for (let i = 0; i < 75; i++) {
    aLongString += 'ateststring1234567890'
  }
  fastify.get('/', (request, reply) => {
    reply.header('Content-Type', 'text/plain')
    reply.send(aLongString)
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      headers: {
        'accept-encoding': 'gzip'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'gzip')
      t.notOk(response.headers['content-length'])
      t.strictEqual(zlib.gunzipSync(body).toString('utf-8'), aLongString)
    })
  })
})

test('should compress if larger than threshold', t => {
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
        'accept-encoding': 'gzip'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.notOk(response.headers['content-length'])
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'gzip')
      t.strictEqual(zlib.gunzipSync(body).toString('utf-8'), 'something larger than threshold')
    })
  })
})

test('support * accept-encoding', t => {
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
        'accept-encoding': '*'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.notOk(response.headers['content-length'])
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'gzip')
      t.strictEqual(zlib.gunzipSync(body).toString('utf-8'), 'something larger than threshold')
    })
  })
})

test('should compress if larger than threshold', t => {
  t.plan(6)

  const fastify = Fastify()

  const options = {
    threshold: 4
  }
  fastify.register(fastifyCompression, options)
  fastify.get('/', (request, reply) => {
    reply.send({ hallo: 'welt' })
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      headers: {
        'accept-encoding': 'gzip'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.notOk(response.headers['content-length'])
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'gzip')
      t.strictEqual(zlib.gunzipSync(body).toString('utf-8'), '{"hallo":"welt"}')
    })
  })
})

test('should use gzip', t => {
  t.plan(4)

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
        'accept-encoding': 'gzip;q=1.0, deflate;q=0.5'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'gzip')
    })
  })
})

test('should remove content length header', t => {
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
        'accept-encoding': 'gzip;q=1.0, deflate;q=0.5'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'gzip')
      t.notOk(response.headers['content-length'])
      t.strictEqual(zlib.gunzipSync(body).toString('utf-8'), 'something larger than threshold')
    })
  })
})

test('should use deflate', t => {
  t.plan(4)

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
        'accept-encoding': 'deflate;q=1.0, gzip;q=0.5'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'deflate')
    })
  })
})

test('should set vary header', t => {
  t.plan(4)

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
        'accept-encoding': 'gzip'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['vary'], 'Accept-Encoding')
    })
  })
})

test('should append vary header', t => {
  t.plan(4)

  const fastify = Fastify()

  const options = {
    threshold: 8
  }
  fastify.register(fastifyCompression, options)
  fastify.get('/', (request, reply) => {
    reply.header('Vary', 'Origin')
    reply.send('something larger than threshold')
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      headers: {
        'accept-encoding': 'gzip'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['vary'], 'Origin, Accept-Encoding')
    })
  })
})

test('should append vary header', t => {
  t.plan(4)

  const fastify = Fastify()

  const options = {
    threshold: 8
  }
  fastify.register(fastifyCompression, options)
  fastify.get('/', (request, reply) => {
    reply.header('Vary', '*')
    reply.send('something larger than threshold')
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      headers: {
        'accept-encoding': 'gzip'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['vary'], '*')
    })
  })
})

test('should not compress if no incoming accept-encoding header', t => {
  t.plan(4)

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
      uri: 'http://localhost:' + fastify.server.address().port
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], undefined)
    })
  })
})

test('should use gzip and consider plain/text', t => {
  t.plan(5)

  const fastify = Fastify()

  const options = {
    threshold: 8
  }
  fastify.register(fastifyCompression, options)
  fastify.get('/', (request, reply) => {
    reply.header('Content-Type', 'text/plain')
    reply.send('something larger than threshold')
  })
  fastify.listen(0, err => {
    fastify.server.unref()
    t.error(err)
    request({
      method: 'GET',
      uri: 'http://localhost:' + fastify.server.address().port,
      headers: {
        'accept-encoding': 'gzip'
      },
      encoding: null
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictEqual(response.headers['content-encoding'], 'gzip')
      t.strictEqual(zlib.gunzipSync(body).toString('utf-8'), 'something larger than threshold')
    })
  })
})
