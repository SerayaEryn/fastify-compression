'use strict';

const fastifyPlugin = require('fastify-plugin');
const compressible = require('compressible');
const zlib = require('zlib');

function compressionPlugin(fastify, opts, next) {
    const threshold = opts.threshold || 1024;

    fastify.addHook('onSend', compression)
    
    function compression(request, reply, payload, done) {
        const acceptEncoding = request.req.headers['accept-encoding'];
        const method = getMethod(acceptEncoding);
        
        if (shouldCompress(reply, method)) {
            if(!reply.res.getHeader('Content-Type') || reply.res.getHeader('Content-Type') === 'application/json') {
                reply.res.setHeader('Content-Type', 'application/json')

                let _payload = reply.serialize(payload)
                if(_payload.length >= threshold) {
                    setVaryHeader(reply);
                    reply.header('Content-Encoding', method);
                    _payload = zlib.gzipSync(_payload);
                }
                reply.serializer(getSerializer(_payload));
            } else if(payload.length >= threshold) {
                setVaryHeader(reply);
                reply.header('Content-Encoding', method);
                reply.serializer(zlib.gzipSync);
            }
        } 
        done();
    }

    next();
}

function getSerializer(_payload) {
    return function _serialize(payload) {
        return _payload
    };
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

exports = module.exports = fastifyPlugin(compressionPlugin, '>=0.34.0');
