'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { buildInjectedScript } = require('../proxy/lib/ui-injection.js');

test('Web IDE & Floating Dock Integration', async (t) => {
    await t.test('buildInjectedScript produces valid JavaScript without un-interpolated template literals', () => {
        const script = buildInjectedScript();
        assert.doesNotThrow(() => {
            new Function(script);
        }, 'Injected script must be syntactically valid JavaScript');

        assert.ok(!script.includes('${MODELS_ICON_SVG}'), 'MODELS_ICON_SVG must be interpolated');
        assert.ok(!script.includes('${EXTERNAL_ICON_SVG}'), 'EXTERNAL_ICON_SVG must be interpolated');
        assert.ok(script.includes('agy-floating-tools-dock'), 'Injected script must include floating tools dock');
    });

    const TEST_PORT = 15580;
    const MOCK_AGY_PORT = 15581;
    const MOCK_IDE_PORT = 15582;

    let receivedHeaders = null;
    let receivedPath = null;
    let mockIdeWsConnected = false;
    let mockIdeWsHeaders = null;

    // 1. Setup Mock Code-Server (HTTP + WebSocket)
    const mockCodeServer = Bun.serve({
        port: MOCK_IDE_PORT,
        hostname: '127.0.0.1',
        async fetch(req, server) {
            if (req.headers.get('upgrade')?.toLowerCase() === 'websocket') {
                mockIdeWsHeaders = Object.fromEntries(req.headers.entries());
                const success = server.upgrade(req);
                if (success) {
                    mockIdeWsConnected = true;
                    return;
                }
                return new Response('WS upgrade failed', { status: 400 });
            }

            const url = new URL(req.url);
            receivedPath = url.pathname + url.search;
            receivedHeaders = Object.fromEntries(req.headers.entries());

            if (url.pathname.endsWith('vsda.js')) {
                return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
            }

            return new Response('Mock Code Server OK', {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        },
        websocket: {
            open(ws) {
                ws.send('welcome-ide');
            },
            message(ws, msg) {
                ws.send(msg);
            }
        }
    });

    // 2. Setup minimal Mock Agy Hub
    const mockAgyServer = Bun.serve({
        port: MOCK_AGY_PORT,
        hostname: '127.0.0.1',
        fetch(req) {
            return new Response('Mock Agy OK', { status: 200 });
        }
    });

    // 3. Spawn auth-proxy.js
    const proxyProc = spawn(process.execPath, [path.join(__dirname, '../proxy/auth-proxy.js')], {
        env: {
            ...process.env,
            AGY_PORT: String(TEST_PORT),
            AGY_HUB_PORT: String(MOCK_AGY_PORT),
            IDE_PORT: String(MOCK_IDE_PORT),
            AUTH_PASSWORD: '', // unauthenticated for test simplicity
            ENABLE_IDE: 'true',
            ENABLE_TERMINAL: 'false'
        },
        stdio: 'pipe'
    });

    let proxyReady = false;
    proxyProc.stdout.on('data', (d) => {
        if (d.toString().includes('Listening on')) proxyReady = true;
    });

    for (let i = 0; i < 40 && !proxyReady; i++) {
        await new Promise(r => setTimeout(r, 50));
    }

    function makeRequest(reqPath, options = {}) {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port: TEST_PORT,
                path: reqPath,
                method: options.method || 'GET',
                headers: options.headers || {}
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
            });
            req.on('error', reject);
            if (options.body) req.write(options.body);
            req.end();
        });
    }

    try {
        await t.test('proxies /ide/ to code-server with x-forwarded-prefix and without global nosniff header', async () => {
            const res = await makeRequest('/ide/');
            assert.equal(res.status, 200);
            assert.equal(receivedPath, '/');
            assert.equal(receivedHeaders['x-forwarded-prefix'], '/ide');
            assert.equal(res.headers['x-content-type-options'], undefined, 'Must not enforce global nosniff on /ide');
        });

        await t.test('coerces 404 .js response from code-server to application/javascript MIME type', async () => {
            const res = await makeRequest('/ide/static/node_modules/vsda/rust/web/vsda.js');
            assert.equal(res.status, 404);
            assert.equal(res.headers['content-type'], 'application/javascript; charset=utf-8');
            assert.equal(res.headers['x-content-type-options'], undefined);
        });

        await t.test('WebSocket connections for /ide upgrade and forward to IDE port', async () => {
            const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/ide/?reconnectionToken=test-token`);
            const messagePromise = new Promise((resolve, reject) => {
                ws.onmessage = (event) => resolve(event.data);
                ws.onerror = reject;
            });

            const welcome = await messagePromise;
            assert.equal(welcome, 'welcome-ide');
            assert.equal(mockIdeWsConnected, true);
            assert.equal(mockIdeWsHeaders['x-forwarded-prefix'], '/ide');
            ws.close();
        });
    } finally {
        proxyProc.kill();
        mockCodeServer.stop();
        mockAgyServer.stop();
    }
});
