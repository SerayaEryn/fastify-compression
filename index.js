'use strict';

const fastifyPlugin = require('fastify-plugin');
const compressible = require('compressible');
const zlib = require('zlib');
const stringToStream = require('string-to-stream')
const encodingNegotiator = require('encoding-negotiator');
const pump = require('pump');

function compressionPlugin(fastify, opts, next) {
    const threshold = opts.threshold || 1024;
    const supportedEncodings = ['gzip', 'deflate'];

    fastify.addHook('onSend', compression)
    
    function compression(request, reply, payload, done) {
        const acceptEncoding = request.req.headers['accept-encoding'];
        const method = encodingNegotiator.negotiate(acceptEncoding, supportedEncodings);

        if (shouldCompress(reply, method)) {
            let payloadStream;
            if (Buffer.byteLength(payload) < threshold) {
                done();
                return;
            }
            payloadStream = stringToStream(payload);
            setVaryHeader(reply);
            reply.header('Content-Encoding', method);
            const compressionStream = method === 'gzip' ? zlib.createGzip() : zlib.createDeflate();
            
            pump(payloadStream, compressionStream, onEnd.bind(request))
            done(null, compressionStream);
            return;
        } 
        done();
    }

    next();
}

function onEnd(err) {
    if(err) this.log.error(err);
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

const metadata = {
    fastify: '>=0.43.0',
    name: 'fastify-compression'
}

exports = module.exports = fastifyPlugin(compressionPlugin, metadata);
