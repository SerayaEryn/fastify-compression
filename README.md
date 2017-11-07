# fastify-compression

[![Build Status](https://travis-ci.org/SerayaEryn/fastify-compression.svg?branch=master)](https://travis-ci.org/SerayaEryn/fastify-compression)
[![Coverage Status](https://coveralls.io/repos/github/SerayaEryn/fastify-compression/badge.svg?branch=master)](https://coveralls.io/github/SerayaEryn/fastify-compression?branch=master)
[![NPM version](https://img.shields.io/npm/v/fastify-compression.svg?style=flat)](https://www.npmjs.com/package/fastify-compression)

A compression plugin for [fastify](http://fastify.io/). 

## Usage

```js
const fastify = require('fastify');
const fastifyCompression = require('fastify-compression');

const app = fastify();
app.register(fastifyCompression, {threshold: 2048});
```

## API
### compression(fastify, options, next)
Compresses the payload with `gzip` or `deflate` if the payload length is above the threshold and a `Accept-Encoding` header is send with the request.
### options
#### threshold (optional)
A `number` that specifies the threshold used to determine if compression should be applied. Defaults to `1024`.

## License

[MIT](./LICENSE)