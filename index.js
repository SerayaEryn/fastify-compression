'use strict';

const fastifyPlugin = require('fastify-plugin');
const compressible = require('compressible');
const zlib = require('zlib');
const stringToStream = require('string-to-stream')
const pump = require('pump');

function compressionPlugin(fastify, opts, next) {
    const threshold = opts.threshold || 1024;

    fastify.addHook('onSend', compression)
    
    function compression(request, reply, payload, done) {
        const acceptEncoding = request.req.headers['accept-encoding'];
        const method = getMethod(acceptEncoding);

        if (shouldCompress(reply, method)) {
            let payloadStream;
            let _payload = payload;
            if (!reply.res.getHeader('Content-Type') || reply.res.getHeader('Content-Type') === 'application/json') {
                reply.res.setHeader('Content-Type', 'application/json');
                _payload = reply.serialize(payload);
            }
            if (Buffer.byteLength(_payload) < threshold) {
                done();
                return;
            }
            payloadStream = stringToStream(_payload);
            setVaryHeader(reply);
            reply.header('Content-Encoding', method);
            const compressionStream = method === 'gzip' ? zlib.createGzip() : zlib.createDeflate();

            done(null, pump(payloadStream, compressionStream, onEnd.bind(request)));
            return;
        } 
        done();
    }

    next();
}

function onEnd(err) {
    if(err) this.log.error(err);
}

function getMethod(acceptEncoding) {
    const encodings = (acceptEncoding || '').split(', ');
    for (const encodingAndQuality of encodings) {
        const [ encoding, ] = encodingAndQuality.split(';');
        if (encoding === 'deflate') {
            return 'deflate';
        } else if (encoding === 'gzip') {
            return 'gzip';
        }
    }

    return 'identity';
}

function setVaryHeader(reply) {
    const varyHeader = reply.res.getHeader('Vary');
    reply.header('Vary', getVaryHeaderValue(varyHeader));
}

function getVaryHeaderValue(varyHeader) {
    let newVaryHeader = 'Accept-Encoding';
    if (varyHeader === '*') {
        newVaryHeader =  '*';
    } else if (varyHeader) {
        newVaryHeader = varyHeader + ', Accept-Encoding';
    }
    return newVaryHeader;
}

function shouldCompress(reply, method) {
    return method !== 'identity' && isCompressible(reply);
}

function isCompressible(reply) {
    const contentType = reply.res.getHeader('Content-Type');
    return contentType ? compressible(contentType) : true;
}

exports = module.exports = fastifyPlugin(compressionPlugin, '>=0.35.0');
