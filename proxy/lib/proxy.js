'use strict';

const http = require('node:http');
const zlib = require('node:zlib');
const { TERMINAL_PORT, IDE_PORT, ENABLE_IDE, ENABLE_TERMINAL } = require('./config');
const { replaceFaviconInHtml } = require('./favicon');
const { renderServiceStartingPage } = require('./pages');
const { INJECTED_UI_STYLES, buildInjectedScript } = require('./ui-injection');

// Hop-by-hop headers defined in RFC 7230 / RFC 9110 to strip when proxying
const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'transfer-encoding',
    'upgrade',
]);

// Dedicated persistent HTTP Agent for upstream proxy requests
const proxyAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 256,
    maxFreeSockets: 64,
    timeout: 0
});

// Strip hop-by-hop headers from an incoming headers object
function filterHopByHop(headers) {
    const out = {};
    for (const [key, value] of Object.entries(headers)) {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
            out[key] = value;
        }
    }
    return out;
}

// Buffer an HTML response, apply a transform, then send it.
// Owns the res.writeHead() call to ensure Content-Length is correct after
// transformation. Falls back to streaming if the response exceeds MAX_HTML_BUFFER_BYTES.
function interceptHtmlResponse(proxyRes, res, statusCode, resHeaders, transform) {
    const MAX_HTML_BUFFER_BYTES = 5 * 1024 * 1024;
    const chunks = [];
    let totalLength = 0;
    let tooLarge = false;

    proxyRes.on('data', (chunk) => {
        if (tooLarge) {
            res.write(chunk);
            return;
        }
        totalLength += chunk.length;
        if (totalLength > MAX_HTML_BUFFER_BYTES) {
            tooLarge = true;
            // Headers not yet sent — write them now before streaming
            res.writeHead(statusCode, resHeaders);
            res.flushHeaders();
            for (const c of chunks) res.write(c);
            res.write(chunk);
            return;
        }
        chunks.push(chunk);
    });

    proxyRes.on('error', (err) => {
        console.error('[HTTP Proxy Upstream Stream Error]', err.message);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Upstream stream error');
        } else {
            res.destroy();
        }
    });

    proxyRes.on('end', () => {
        if (tooLarge) {
            res.end();
            return;
        }
        let rawBuffer = Buffer.concat(chunks);
        const encoding = (resHeaders['content-encoding'] || '').toLowerCase();
        if (encoding === 'gzip') {
            try {
                rawBuffer = zlib.gunzipSync(rawBuffer);
            } catch (e) {
                console.error('[Proxy Gateway] Failed to decompress gzipped HTML:', e.message);
            }
        } else if (encoding === 'deflate') {
            try {
                rawBuffer = zlib.inflateSync(rawBuffer);
            } catch (e) {
                console.error('[Proxy Gateway] Failed to decompress deflated HTML:', e.message);
            }
        } else if (encoding === 'br') {
            try {
                rawBuffer = zlib.brotliDecompressSync(rawBuffer);
            } catch (e) {
                console.error('[Proxy Gateway] Failed to decompress brotli HTML:', e.message);
            }
        }

        let html = rawBuffer.toString('utf8');
        html = transform(html);
        // Update content-length to reflect transformed HTML size, then send uncompressed
        resHeaders['content-length'] = Buffer.byteLength(html, 'utf8');
        delete resHeaders['content-encoding'];
        res.writeHead(statusCode, resHeaders);
        res.end(html);
    });
}

// Forward request to ttyd Web Terminal
function proxyToTerminal(req, res, targetPath) {
    if (req.socket) req.socket.setNoDelay(true);
    if (res.socket) res.socket.setNoDelay(true);

    const proxyHeaders = filterHopByHop(req.headers);
    proxyHeaders['host'] = `localhost:${TERMINAL_PORT}`;
    proxyHeaders['origin'] = `http://localhost:${TERMINAL_PORT}`;

    // Request uncompressed body only for top-level HTML requests to preserve compression on web assets
    const wantsHtml = (req.headers.accept || '').includes('text/html') || targetPath === '/' || targetPath === '/terminal' || targetPath === '/terminal/';
    if (wantsHtml) {
        proxyHeaders['accept-encoding'] = 'identity';
    }

    const proxyReq = http.request({
        hostname: '127.0.0.1',
        port: TERMINAL_PORT,
        path: targetPath,
        method: req.method,
        headers: proxyHeaders,
        agent: proxyAgent
    }, (proxyRes) => {
        if (proxyRes.socket) proxyRes.socket.setNoDelay(true);

        const resHeaders = filterHopByHop(proxyRes.headers);
        resHeaders['x-accel-buffering'] = 'no';

        const encoding = resHeaders['content-encoding'];
        const isUncompressed = !encoding || encoding === 'identity';
        const isHtmlResponse = (resHeaders['content-type'] || '').includes('text/html') && isUncompressed;
        if (isHtmlResponse && req.method === 'GET') {
            interceptHtmlResponse(proxyRes, res, proxyRes.statusCode, resHeaders, (html) => {
                html = replaceFaviconInHtml(html);
                html = html.replace(/<title>ttyd - Terminal<\/title>/i, '<title>Antigravity Terminal</title>');
                return html;
            });
            return;
        }

        res.writeHead(proxyRes.statusCode, resHeaders);
        res.flushHeaders();
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        if (!res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(renderServiceStartingPage('Host Terminal'));
        } else {
            res.destroy();
        }
    });

    req.pipe(proxyReq, { end: true });
}

// Forward request to code-server Web IDE
function proxyToIde(req, res, targetPath) {
    if (req.socket) req.socket.setNoDelay(true);
    if (res.socket) res.socket.setNoDelay(true);

    const proxyHeaders = filterHopByHop(req.headers);
    const hostHeader = req.headers['x-forwarded-host'] || req.headers['host'] || `localhost:${IDE_PORT}`;
    const protoHeader = req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http');

    proxyHeaders['host'] = hostHeader;
    proxyHeaders['x-forwarded-host'] = hostHeader;
    proxyHeaders['x-forwarded-proto'] = protoHeader;
    proxyHeaders['x-forwarded-prefix'] = '/ide';
    if (req.headers['origin']) {
        proxyHeaders['origin'] = req.headers['origin'];
    } else {
        delete proxyHeaders['origin'];
    }

    // Allow code-server to manage its own Content-Security-Policy & Frame Options
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');

    // Request uncompressed body only for top-level HTML requests to preserve gzip/brotli on IDE bundles
    const wantsHtml = (req.headers.accept || '').includes('text/html') || targetPath === '/' || targetPath.startsWith('/?');
    if (wantsHtml) {
        proxyHeaders['accept-encoding'] = 'identity';
    }

    const proxyReq = http.request({
        hostname: '127.0.0.1',
        port: IDE_PORT,
        path: targetPath,
        method: req.method,
        headers: proxyHeaders,
        agent: proxyAgent
    }, (proxyRes) => {
        if (proxyRes.socket) proxyRes.socket.setNoDelay(true);

        const resHeaders = filterHopByHop(proxyRes.headers);

        // Rewrite Location headers to stay under the /ide prefix
        if (resHeaders['location'] && typeof resHeaders['location'] === 'string') {
            let loc = resHeaders['location'];
            loc = loc.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
            if (loc.startsWith('/') && !loc.startsWith('/ide/')) {
                resHeaders['location'] = '/ide' + loc;
            } else {
                resHeaders['location'] = loc;
            }
        }
        resHeaders['x-accel-buffering'] = 'no';

        const encoding = (resHeaders['content-encoding'] || '').toLowerCase();
        const isSupportedEncoding = !encoding || encoding === 'identity' || encoding === 'gzip' || encoding === 'deflate' || encoding === 'br';
        const isHtmlResponse = (resHeaders['content-type'] || '').includes('text/html') && isSupportedEncoding;
        const isMainIdeDocument = targetPath === '/' || targetPath.startsWith('/?');
        if (isHtmlResponse && req.method === 'GET' && isMainIdeDocument) {
            interceptHtmlResponse(proxyRes, res, proxyRes.statusCode, resHeaders, replaceFaviconInHtml);
            return;
        }

        // Prevent browser strict MIME check errors on missing optional JS modules (e.g. vsda.js)
        if (proxyRes.statusCode === 404 && targetPath.endsWith('.js')) {
            resHeaders['content-type'] = 'application/javascript; charset=utf-8';
        }

        res.writeHead(proxyRes.statusCode, resHeaders);
        res.flushHeaders();
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        if (!res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(renderServiceStartingPage('Web IDE'));
        } else {
            res.destroy();
        }
    });

    req.pipe(proxyReq, { end: true });
}

// Helper to determine if a request path corresponds to a browser SPA frontend route
function isSpaRoute(pathname) {
    if (pathname === '/' || pathname === '/index.html') return true;
    if (pathname.startsWith('/c/') || pathname === '/c') return true;
    if (pathname.startsWith('/history')) return true;
    if (pathname.startsWith('/projects')) return true;
    if (pathname.startsWith('/tasks')) return true;
    return false;
}

// Proxy HTTP request to the main Antigravity upstream (agy), injecting tools UI on HTML responses
function proxyToUpstream(req, res, targetPort, sidecarManager) {
    if (req.socket) req.socket.setNoDelay(true);
    if (res.socket) res.socket.setNoDelay(true);

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    const proxyHeaders = filterHopByHop(req.headers);
    proxyHeaders['host'] = `localhost:${targetPort}`;
    proxyHeaders['origin'] = `http://localhost:${targetPort}`;
    if (req.headers['referer']) {
        proxyHeaders['referer'] = req.headers['referer'].replace(/^https?:\/\/[^/]+/, `http://localhost:${targetPort}`);
    }

    // Request uncompressed body only for SPA document routes and HTML requests to preserve compression
    if (isSpaRoute(parsedUrl.pathname) || (req.headers.accept || '').includes('text/html')) {
        proxyHeaders['accept-encoding'] = 'identity';
    }

    const proxyReq = http.request({
        hostname: '127.0.0.1',
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: proxyHeaders,
        agent: proxyAgent,
    }, (proxyRes) => {
        if (proxyRes.socket) proxyRes.socket.setNoDelay(true);

        const resHeaders = filterHopByHop(proxyRes.headers);

        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? new Set(process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()))
            : null;
        if (resHeaders['access-control-allow-origin'] && req.headers.origin) {
            if (allowedOrigins && allowedOrigins.has(req.headers.origin)) {
                resHeaders['access-control-allow-origin'] = req.headers.origin;
            } else if (!allowedOrigins) {
                delete resHeaders['access-control-allow-origin'];
            }
        }

        resHeaders['x-accel-buffering'] = 'no';

        const encoding = (resHeaders['content-encoding'] || '').toLowerCase();
        const isSupportedEncoding = !encoding || encoding === 'identity' || encoding === 'gzip' || encoding === 'deflate' || encoding === 'br';
        const isHtmlResponse = (resHeaders['content-type'] || '').includes('text/html') && isSupportedEncoding;

        // INTERCEPT HTML RESPONSES TO INJECT WORKSPACE TOOLS BUTTONS AND OVERRIDE FAVICON
        if (isHtmlResponse && req.method === 'GET') {
            interceptHtmlResponse(proxyRes, res, proxyRes.statusCode, resHeaders, (html) => {
                const csrfMatch = html.match(/"csrfToken":"([^"]+)"/);
                if (csrfMatch && sidecarManager) {
                    sidecarManager.setCsrfToken(csrfMatch[1]);
                }

                // Remove existing upstream/emoji favicon tags and inject Antigravity favicon
                html = replaceFaviconInHtml(html);

                const customScript = buildInjectedScript();
                if (customScript) {
                    const injection = `<style>${INJECTED_UI_STYLES}</style><script id="agy-injected-tools-script">${customScript}</script>`;
                    if (html.includes('</body>')) {
                        html = html.replace('</body>', `${injection}</body>`);
                    } else if (html.includes('</html>')) {
                        html = html.replace('</html>', `${injection}</html>`);
                    } else {
                        html += injection;
                    }
                }
                return html;
            });
            return;
        }

        res.writeHead(proxyRes.statusCode, resHeaders);
        res.flushHeaders();
        proxyRes.pipe(res);
    });

    proxyReq.on('socket', (sock) => {
        sock.setNoDelay(true);
    });

    const clientAbortHandler = () => {
        if (!res.writableFinished && !res.writableEnded && !proxyReq.destroyed) {
            proxyReq.destroy();
        }
    };

    res.on('close', clientAbortHandler);
    res.on('error', clientAbortHandler);
    req.on('error', clientAbortHandler);

    proxyReq.on('error', (err) => {
        console.error('[HTTP Proxy Error]', err.message);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Antigravity upstream server unavailable.');
        } else {
            res.destroy();
        }
    });

    req.pipe(proxyReq, { end: true });
}

// Helper to serialize HTTP status and headers into raw wire format
function formatRawHttpResponse(statusCode, statusMessage, headers) {
    let raw = `HTTP/1.1 ${statusCode}${statusMessage ? ' ' + statusMessage : ''}\r\n`;
    for (const [key, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
            for (const v of value) raw += `${key}: ${v}\r\n`;
        } else {
            raw += `${key}: ${value}\r\n`;
        }
    }
    raw += '\r\n';
    return raw;
}

// Handle WebSocket / Upgrade requests
function handleWebSocketUpgrade(req, clientSocket, head, targetPort) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let wsTargetPort = targetPort;
    let wsTargetPath = req.url;

    if (parsedUrl.pathname.startsWith('/terminal')) {
        if (!ENABLE_TERMINAL) {
            clientSocket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            clientSocket.destroy();
            return;
        }
        wsTargetPort = TERMINAL_PORT;
        wsTargetPath = req.url;
    } else if (parsedUrl.pathname.startsWith('/ide')) {
        if (!ENABLE_IDE) {
            clientSocket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            clientSocket.destroy();
            return;
        }
        wsTargetPort = IDE_PORT;
        let p = req.url.replace(/^\/ide/, '');
        if (!p.startsWith('/')) p = '/' + p;
        wsTargetPath = p;
    } else if (parsedUrl.pathname.startsWith('/vscode-remote-resource')) {
        if (!ENABLE_IDE) {
            clientSocket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            clientSocket.destroy();
            return;
        }
        wsTargetPort = IDE_PORT;
        wsTargetPath = req.url;
    } else {
        if (!targetPort) {
            clientSocket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
            clientSocket.destroy();
            return;
        }
        wsTargetPort = targetPort;
    }

    clientSocket.setNoDelay(true);
    clientSocket.setTimeout(0);
    if (clientSocket.setKeepAlive) clientSocket.setKeepAlive(true, 15000);

    const proxyHeaders = { ...req.headers };
    if (wsTargetPort === IDE_PORT) {
        const hostHeader = req.headers['x-forwarded-host'] || req.headers['host'] || `localhost:${IDE_PORT}`;
        const protoHeader = req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http');
        proxyHeaders['host'] = hostHeader;
        proxyHeaders['x-forwarded-host'] = hostHeader;
        proxyHeaders['x-forwarded-proto'] = protoHeader;
        proxyHeaders['x-forwarded-prefix'] = '/ide';
        if (req.headers['origin']) {
            proxyHeaders['origin'] = req.headers['origin'];
        }
    } else {
        proxyHeaders['host'] = `localhost:${wsTargetPort}`;
        proxyHeaders['origin'] = `http://localhost:${wsTargetPort}`;
        if (proxyHeaders['referer']) {
            proxyHeaders['referer'] = proxyHeaders['referer'].replace(/^https?:\/\/[^/]+/, `http://localhost:${wsTargetPort}`);
        }
    }

    const upstreamReq = http.request({
        hostname: '127.0.0.1',
        port: wsTargetPort,
        path: wsTargetPath,
        method: req.method,
        headers: proxyHeaders,
        agent: false,
    });

    const earlyClientErrorHandler = () => {
        upstreamReq.destroy();
    };
    clientSocket.once('error', earlyClientErrorHandler);
    clientSocket.once('close', earlyClientErrorHandler);

    upstreamReq.on('upgrade', (upstreamRes, upstreamSocket, upstreamHead) => {
        clientSocket.removeListener('error', earlyClientErrorHandler);
        clientSocket.removeListener('close', earlyClientErrorHandler);
        upstreamSocket.setNoDelay(true);
        upstreamSocket.setTimeout(0);
        if (upstreamSocket.setKeepAlive) upstreamSocket.setKeepAlive(true, 15000);

        const rawResponse = formatRawHttpResponse(101, 'Switching Protocols', upstreamRes.headers);
        clientSocket.write(rawResponse);
        if (upstreamHead && upstreamHead.length > 0) clientSocket.write(upstreamHead);
        if (head && head.length > 0) upstreamSocket.write(head);

        upstreamSocket.pipe(clientSocket);
        clientSocket.pipe(upstreamSocket);

        const cleanup = () => {
            upstreamSocket.destroy();
            clientSocket.destroy();
        };

        upstreamSocket.on('error', cleanup);
        clientSocket.on('error', cleanup);
        upstreamSocket.on('close', cleanup);
        clientSocket.on('close', cleanup);
        upstreamSocket.on('end', () => clientSocket.end());
        clientSocket.on('end', () => upstreamSocket.end());
    });

    upstreamReq.on('response', (upstreamRes) => {
        clientSocket.removeListener('error', earlyClientErrorHandler);
        clientSocket.removeListener('close', earlyClientErrorHandler);
        const rawResponse = formatRawHttpResponse(upstreamRes.statusCode, upstreamRes.statusMessage || '', upstreamRes.headers);
        clientSocket.write(rawResponse);
        upstreamRes.pipe(clientSocket);
    });

    upstreamReq.on('error', (err) => {
        clientSocket.removeListener('error', earlyClientErrorHandler);
        clientSocket.removeListener('close', earlyClientErrorHandler);
        console.error('[WebSocket Upgrade Error]', err.message);
        clientSocket.destroy();
    });

    upstreamReq.end();
}

module.exports = {
    proxyToTerminal,
    proxyToIde,
    isSpaRoute,
    proxyToUpstream,
    handleWebSocketUpgrade,
};
