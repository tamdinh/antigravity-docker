const fs = require('node:fs');

function isFeatureEnabled(val, defaultVal = true) {
    if (val === undefined || val === null || val === '') return defaultVal;
    const s = String(val).trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

function getAuthPassword() {
    if (process.env.AUTH_PASSWORD) return process.env.AUTH_PASSWORD;
    const passwordFile = process.env.AUTH_PASSWORD_FILE || '/home/developer/.gemini/config/auth_password';
    try {
        if (fs.existsSync(passwordFile)) {
            const pass = fs.readFileSync(passwordFile, 'utf8').trim();
            if (pass) return pass;
        }
    } catch (e) {}
    return '';
}

const LISTEN_PORT = parseInt(process.env.AGY_PORT || '4400', 10);
const AGY_HUB_PORT = parseInt(process.env.AGY_HUB_PORT || process.env.INITIAL_TARGET_PORT || '4402', 10);
const PORT_FILE = process.env.PORT_FILE || '/tmp/antigravity_port';
const INSTANCE_NAME = process.env.RC_NAME || 'server-agent';
const TERMINAL_PORT = parseInt(process.env.TERMINAL_PORT || '7681', 10);
const IDE_PORT = parseInt(process.env.IDE_PORT || '8080', 10);

const ENABLE_IDE = isFeatureEnabled(process.env.ENABLE_IDE, true);
const ENABLE_TERMINAL = isFeatureEnabled(process.env.ENABLE_TERMINAL, true);
const TRUST_PROXY = isFeatureEnabled(process.env.TRUST_PROXY, false);

module.exports = {
    isFeatureEnabled,
    getAuthPassword,
    get AUTH_PASSWORD() { return getAuthPassword(); },
    LISTEN_PORT,
    AGY_HUB_PORT,
    PORT_FILE,
    INSTANCE_NAME,
    TERMINAL_PORT,
    IDE_PORT,
    ENABLE_IDE,
    ENABLE_TERMINAL,
    TRUST_PROXY,
};
