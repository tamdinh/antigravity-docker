const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { proxyToIde, handleWebSocketUpgrade } = require('../proxy/lib/proxy.js');
const { IDE_PORT } = require('../proxy/lib/config.js');

test('Web IDE (code-server) Proxy Integration', async (t) => {
    let mockIdeServer;
    let mockIdeRequests = [];
    let mockIdeWsUpgrade = null;

    // Start a mock code-server on IDE_PORT (8080)
    await new Promise((resolve) => {
        mockIdeServer = http.createServer((req, res) => {
            mockIdeRequests.push({
                url: req.url,
                method: req.method,
                headers: req.headers
            });
            res.writeHead(200, {
                'content-type': 'text/html; charset=utf-8',
                'content-security-policy': "default-src 'self' https:;",
                'x-frame-options': 'ALLOWALL'
            });
            res.end('<!DOCTYPE html><html><head><title>code-server</title></head><body>IDE</body></html>');
        });

        mockIdeServer.on('upgrade', (req, socket, head) => {
            mockIdeWsUpgrade = {
                url: req.url,
                headers: req.headers
            };
            socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n');
            socket.pipe(socket);
        });

        mockIdeServer.listen(IDE_PORT, '127.0.0.1', () => {
            resolve();
        });
    });

    t.after(() => {
        mockIdeServer.close();
    });

    await t.test('proxyToIde forwards X-Forwarded-Host, Proto, Prefix, and Origin to code-server', async () => {
        mockIdeRequests = [];

        // Start a test proxy server that calls proxyToIde
        const testProxy = http.createServer((req, res) => {
            res.setHeader('Content-Security-Policy', "default-src 'none';");
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            proxyToIde(req, res, req.url.replace(/^\/ide/, '') || '/');
        });

        await new Promise((resolve) => testProxy.listen(0, '127.0.0.1', resolve));
        const proxyPort = testProxy.address().port;

        try {
            const clientReq = http.request({
                hostname: '127.0.0.1',
                port: proxyPort,
                path: '/ide/?folder=/workspace',
                method: 'GET',
                headers: {
                    'host': 'my-vps.dokploy.app',
                    'x-forwarded-host': 'my-vps.dokploy.app',
                    'x-forwarded-proto': 'https',
                    'origin': 'https://my-vps.dokploy.app',
                    'accept': 'text/html'
                }
            });

            const res = await new Promise((resolve, reject) => {
                clientReq.on('response', resolve);
                clientReq.on('error', reject);
                clientReq.end();
            });

            assert.equal(res.statusCode, 200);
            // Verify our proxy did NOT leak the default gateway Content-Security-Policy or X-Frame-Options
            assert.equal(res.headers['content-security-policy'], "default-src 'self' https:;");
            assert.equal(res.headers['x-frame-options'], 'ALLOWALL');

            assert.equal(mockIdeRequests.length, 1);
            const r = mockIdeRequests[0];
            assert.equal(r.url, '/?folder=/workspace');
            assert.equal(r.headers['host'], 'my-vps.dokploy.app');
            assert.equal(r.headers['x-forwarded-host'], 'my-vps.dokploy.app');
            assert.equal(r.headers['x-forwarded-proto'], 'https');
            assert.equal(r.headers['x-forwarded-prefix'], '/ide');
            assert.equal(r.headers['origin'], 'https://my-vps.dokploy.app');
        } finally {
            testProxy.close();
        }
    });

    await t.test('handleWebSocketUpgrade forwards headers and prefix to code-server', async () => {
        mockIdeWsUpgrade = null;

        const testProxy = http.createServer();
        testProxy.on('upgrade', (req, socket, head) => {
            handleWebSocketUpgrade(req, socket, head, 4402);
        });

        await new Promise((resolve) => testProxy.listen(0, '127.0.0.1', resolve));
        const proxyPort = testProxy.address().port;

        try {
            const upgradeReq = http.request({
                hostname: '127.0.0.1',
                port: proxyPort,
                path: '/ide/?reconnectionToken=123',
                headers: {
                    'Connection': 'Upgrade',
                    'Upgrade': 'websocket',
                    'Host': 'my-vps.dokploy.app',
                    'X-Forwarded-Host': 'my-vps.dokploy.app',
                    'X-Forwarded-Proto': 'https',
                    'Origin': 'https://my-vps.dokploy.app',
                    'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
                    'Sec-WebSocket-Version': '13'
                }
            });

            const upgraded = await new Promise((resolve, reject) => {
                upgradeReq.on('upgrade', (res, socket, head) => {
                    socket.destroy();
                    resolve(res);
                });
                upgradeReq.on('error', reject);
                upgradeReq.end();
            });

            assert.equal(upgraded.statusCode, 101);
            assert.ok(mockIdeWsUpgrade);
            assert.equal(mockIdeWsUpgrade.url, '/?reconnectionToken=123');
            assert.equal(mockIdeWsUpgrade.headers['host'], 'my-vps.dokploy.app');
            assert.equal(mockIdeWsUpgrade.headers['x-forwarded-host'], 'my-vps.dokploy.app');
            assert.equal(mockIdeWsUpgrade.headers['x-forwarded-proto'], 'https');
            assert.equal(mockIdeWsUpgrade.headers['x-forwarded-prefix'], '/ide');
            assert.equal(mockIdeWsUpgrade.headers['origin'], 'https://my-vps.dokploy.app');
        } finally {
            testProxy.close();
        }
    });
});
