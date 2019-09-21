# fastify-compression

> DEPRECATED Please use [fastify-compress](https://github.com/fastify/fastify-compress) instead.

A compression plugin for [Fastify](http://fastify.io/). Supports `gzip`, `deflate` and `brotli`.

## Usage

```js
const fastify = require('fastify');
const fastifyCompression = require('fastify-compression');

const app = fastify();
app.register(fastifyCompression, {threshold: 2048});
```

## API
### compression(fastify, options, next)
Compresses the payload with `gzip`, `brotli` or `deflate` if the payload length is above the threshold and a `Accept-Encoding` header is send with the request. In case of an asterisk `*` in the `Accept-Encoding` header `gzip` will be chosen.
### options
#### threshold (optional)
A `number` that specifies the threshold used to determine if compression should be applied. Defaults to `1024`.
#### brotli
To enable Brotli compression pass the [iltorb](https://www.npmjs.com/package/iltorb) module with the `brotli` option.<br>
**Note:**  Since version `11.7.0` brotli is being supported by Node.js itself. Therefore the `brotli` option is no longer necessary.

## License

[MIT](./LICENSE)