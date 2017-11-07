'use strict';

const fastifyPlugin = require('fastify-plugin');
const compressible = require('compressible');
const zlib = require('zlib');
const serialize = require('fastify/lib/validation').serialize;

function compressionPlugin(fastify, opts, next) {
    const threshold = opts.threshold || 1024;

    fastify.addHook('onSend', compression)
    
    function compression(request, reply, payload, done) {
        const acceptEncoding = request.req.headers['accept-encoding'];
        const method = getMethod(acceptEncoding);
        
        if (shouldCompress(reply, method)) {
            if(!reply.res.getHeader('Content-Type') || reply.res.getHeader('Content-Type') === 'application/json') {
                reply.res.setHeader('Content-Type', 'application/json')

                function _serialize(payload) {
                    const _payload = serialize(reply.context, payload, reply.res.statusCode)
                    if(_payload.length >= threshold) {
                        setVaryHeader(reply);
                        reply.header('Content-Encoding', method);
                        return zlib.gzipSync(_payload);
                    }
                    return _payload
                }
                reply.serializer(_serialize);
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

exports = module.exports = fastifyPlugin(compressionPlugin, '>=0.33.0');
