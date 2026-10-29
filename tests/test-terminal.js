const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function stripAnsi(str) {
    return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

test('Terminal Gateway - Container Shell & Dokploy Fork Maintenance', async (t) => {
    const rootDir = path.resolve(__dirname, '..');
    const forkTerminalScript = path.join(rootDir, 'scripts/fork/host-terminal.sh');
    const rootTerminalScript = path.join(rootDir, 'scripts/host-terminal.sh');
    const dockerfileFork = path.join(rootDir, 'Dockerfile.fork');
    const forkInitScript = path.join(rootDir, 'scripts/fork/init.sh');

    await t.test('scripts/fork/host-terminal.sh exists and is executable', () => {
        assert.ok(fs.existsSync(forkTerminalScript), 'scripts/fork/host-terminal.sh must exist');
        const stat = fs.statSync(forkTerminalScript);
        assert.ok((stat.mode & 0o111) !== 0, 'scripts/fork/host-terminal.sh must be executable');
    });

    await t.test('scripts/host-terminal.sh exists and matches fork terminal gateway features', () => {
        assert.ok(fs.existsSync(rootTerminalScript), 'scripts/host-terminal.sh must exist');
        const content = fs.readFileSync(rootTerminalScript, 'utf8');
        assert.ok(content.includes('start_container_shell'), 'rootTerminalScript must include start_container_shell');
        assert.ok(content.includes('TERMINAL_MODE'), 'rootTerminalScript must support TERMINAL_MODE');
    });

    await t.test('Dockerfile.fork copies and installs fork host-terminal.sh to /usr/local/bin', () => {
        const dockerfileContent = fs.readFileSync(dockerfileFork, 'utf8');
        assert.ok(
            dockerfileContent.includes('host-terminal.sh /usr/local/bin/host-terminal.sh'),
            'Dockerfile.fork must install fork host-terminal.sh to /usr/local/bin/host-terminal.sh'
        );
    });

    await t.test('scripts/fork/init.sh ensures /usr/local/bin/host-terminal.sh is active at startup', () => {
        const initContent = fs.readFileSync(forkInitScript, 'utf8');
        assert.ok(
            initContent.includes('/usr/local/bin/host-terminal.sh'),
            'scripts/fork/init.sh must ensure /usr/local/bin/host-terminal.sh is deployed from fork scripts'
        );
    });

    await t.test('TERMINAL_MODE=container immediately launches container shell', () => {
        const result = spawnSync('/bin/bash', [forkTerminalScript], {
            env: {
                ...process.env,
                TERMINAL_MODE: 'container',
                SHELL: '/bin/sh'
            },
            input: 'exit 0\n',
            encoding: 'utf8',
            timeout: 5000
        });

        assert.equal(result.status, 0);
        const cleanOutput = stripAnsi(result.stdout);
        assert.ok(cleanOutput.includes('Google Antigravity Container Terminal'), 'Must display container terminal header');
        assert.ok(cleanOutput.includes('Mode: Container Shell (local)'), 'Must indicate local container shell mode');
    });

    await t.test('TERMINAL_MODE=auto with empty HOST_SSH_USER displays interactive menu and defaults to container shell on Enter or timeout', () => {
        const result = spawnSync('/bin/bash', [forkTerminalScript], {
            env: {
                ...process.env,
                TERMINAL_MODE: 'auto',
                HOST_SSH_USER: '',
                TERMINAL_CHOICE_TIMEOUT: '1',
                SHELL: '/bin/sh'
            },
            input: '\nexit 0\n',
            encoding: 'utf8',
            timeout: 5000
        });

        assert.equal(result.status, 0);
        const cleanOutput = stripAnsi(result.stdout);
        assert.ok(cleanOutput.includes('Google Antigravity Terminal Gateway'), 'Must display gateway header');
        assert.ok(cleanOutput.includes('[1] Start Container Shell'), 'Must offer choice 1 (Container Shell)');
        assert.ok(cleanOutput.includes('[2] Connect to Host Machine via SSH'), 'Must offer choice 2 (Host SSH)');
        assert.ok(cleanOutput.includes('Google Antigravity Container Terminal'), 'Must default to container terminal');
    });

    await t.test('Option 1 explicitly selects container shell', () => {
        const result = spawnSync('/bin/bash', [forkTerminalScript], {
            env: {
                ...process.env,
                TERMINAL_MODE: 'choice',
                HOST_SSH_USER: 'test-user',
                TERMINAL_CHOICE_TIMEOUT: '2',
                SHELL: '/bin/sh'
            },
            input: '1\nexit 0\n',
            encoding: 'utf8',
            timeout: 5000
        });

        assert.equal(result.status, 0);
        const cleanOutput = stripAnsi(result.stdout);
        assert.ok(cleanOutput.includes('Google Antigravity Container Terminal'), 'Must start container shell when option 1 is selected');
    });
});
