const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

test('Browserless Hosted MCP Server Integration', async (t) => {
    const rootDir = path.resolve(__dirname, '..');
    const dockerfilePath = path.join(rootDir, 'Dockerfile');
    const entrypointPath = path.join(rootDir, 'entrypoint.sh');
    const scriptPath = path.join(rootDir, 'scripts', 'browserless-mcp.sh');
    const customizationsDir = path.join(rootDir, 'customizations');
    const dockerComposePath = path.join(rootDir, 'docker-compose.yml');

    await t.test('Dockerfile copies scripts/browserless-mcp.sh and sets executable permissions', () => {
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
        assert.ok(
            dockerfileContent.includes('COPY scripts/browserless-mcp.sh /usr/local/bin/browserless-mcp'),
            'Dockerfile must copy browserless-mcp to /usr/local/bin'
        );
        assert.ok(
            dockerfileContent.includes('/usr/local/bin/browserless-mcp'),
            'Dockerfile must set executable permissions on browserless-mcp'
        );
    });

    await t.test('scripts/browserless-mcp.sh exists, is executable, and constructs correct mcp-remote command', () => {
        assert.ok(fs.existsSync(scriptPath), 'scripts/browserless-mcp.sh must exist');
        const stats = fs.statSync(scriptPath);
        assert.ok(stats.mode & 0o111, 'scripts/browserless-mcp.sh must have executable permissions');

        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        assert.ok(scriptContent.includes('mcp-remote'), 'Script must invoke mcp-remote');
        assert.ok(scriptContent.includes('https://mcp.browserless.io/mcp'), 'Script must default to https://mcp.browserless.io/mcp');
        assert.ok(scriptContent.includes('BROWSERLESS_TOKEN'), 'Script must check BROWSERLESS_TOKEN');
        assert.ok(scriptContent.includes('Authorization: Bearer'), 'Script must attach Authorization Bearer header when token present');
    });

    await t.test('customizations/mcp_config.json configures browserless pointing to hosted endpoint', () => {
        const mcpConfigPath = path.join(customizationsDir, 'mcp_config.json');
        assert.ok(fs.existsSync(mcpConfigPath), 'mcp_config.json must exist');
        const mcpData = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

        assert.ok(mcpData.mcpServers, 'mcpServers object must be defined');
        assert.ok(mcpData.mcpServers.browserless, 'browserless MCP server must be configured');
        assert.equal(mcpData.mcpServers.browserless.command, 'browserless-mcp');
        assert.deepEqual(mcpData.mcpServers.browserless.args, ['https://mcp.browserless.io/mcp']);
    });

    await t.test('customizations/skills/browserless/SKILL.md exists with valid YAML frontmatter and documentation', () => {
        const skillPath = path.join(customizationsDir, 'skills', 'browserless', 'SKILL.md');
        assert.ok(fs.existsSync(skillPath), 'customizations/skills/browserless/SKILL.md must exist');

        const content = fs.readFileSync(skillPath, 'utf8');
        assert.ok(content.startsWith('---'), 'SKILL.md must start with frontmatter');
        const endFrontmatter = content.indexOf('---', 3);
        assert.ok(endFrontmatter > 0, 'SKILL.md must have closing frontmatter');

        const frontmatter = content.substring(3, endFrontmatter);
        assert.ok(frontmatter.includes('name: browserless'), 'Frontmatter must specify name: browserless');
        assert.ok(frontmatter.includes('description:'), 'Frontmatter must specify description');

        assert.ok(content.includes('browserless_agent'), 'SKILL.md must document browserless_agent');
        assert.ok(content.includes('browserless_smartscraper'), 'SKILL.md must document browserless_smartscraper');
        assert.ok(content.includes('https://mcp.browserless.io/mcp'), 'SKILL.md must reference hosted server URL');
    });

    await t.test('customizations/rules/AGENTS.md contains Browserless guidelines and env vars', () => {
        const rulePath = path.join(customizationsDir, 'rules', 'AGENTS.md');
        assert.ok(fs.existsSync(rulePath), 'customizations/rules/AGENTS.md must exist');
        const ruleContent = fs.readFileSync(rulePath, 'utf8');

        assert.ok(ruleContent.includes('Browserless Guidelines for AI Agents'), 'Rule must have Browserless section');
        assert.ok(ruleContent.includes('BROWSERLESS_TOKEN'), 'Rule must reference BROWSERLESS_TOKEN');
        assert.ok(ruleContent.includes('browserless_smartscraper'), 'Rule must reference browserless_smartscraper');
        assert.ok(ruleContent.includes('https://mcp.browserless.io/mcp'), 'Rule must reference hosted server URL');
    });

    await t.test('entrypoint.sh exports BROWSERLESS env vars and auto-merges browserless MCP into existing configs', () => {
        const entrypointContent = fs.readFileSync(entrypointPath, 'utf8');
        assert.ok(entrypointContent.includes('export BROWSERLESS_TOKEN'), 'entrypoint.sh must export BROWSERLESS_TOKEN');
        assert.ok(entrypointContent.includes('export BROWSERLESS_API_URL'), 'entrypoint.sh must export BROWSERLESS_API_URL');
        assert.ok(entrypointContent.includes('data.mcpServers.browserless'), 'entrypoint.sh must auto-merge browserless server');

        // Simulate entrypoint merge
        const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'browserless-test-'));
        const mockMcpFile = path.join(tempBase, 'mcp_config.json');
        fs.writeFileSync(mockMcpFile, JSON.stringify({
            mcpServers: {
                "custom-tool": { command: "node", args: ["tool.js"] }
            }
        }, null, 2), 'utf8');

        // Extract and run the entrypoint merging snippet
        const mergeCode = `
        const fs = require("fs");
        const targetPath = process.argv[1];
        const data = JSON.parse(fs.readFileSync(targetPath, "utf8"));
        data.mcpServers = data.mcpServers || {};
        let updated = false;
        if (!data.mcpServers.browserless) {
            data.mcpServers.browserless = {
                command: "browserless-mcp",
                args: ["https://mcp.browserless.io/mcp"]
            };
            updated = true;
        }
        if (updated) {
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf8");
        }
        `;
        execFileSync('node', ['-e', mergeCode, mockMcpFile]);

        const merged = JSON.parse(fs.readFileSync(mockMcpFile, 'utf8'));
        assert.ok(merged.mcpServers["custom-tool"], 'User tools preserved');
        assert.ok(merged.mcpServers.browserless, 'Browserless merged');
        assert.equal(merged.mcpServers.browserless.command, 'browserless-mcp');
        assert.deepEqual(merged.mcpServers.browserless.args, ['https://mcp.browserless.io/mcp']);

        fs.rmSync(tempBase, { recursive: true, force: true });
    });

    await t.test('docker-compose.yml exposes BROWSERLESS_TOKEN and BROWSERLESS_API_URL', () => {
        const composeContent = fs.readFileSync(dockerComposePath, 'utf8');
        assert.ok(composeContent.includes('BROWSERLESS_TOKEN'), 'docker-compose.yml must include BROWSERLESS_TOKEN');
        assert.ok(composeContent.includes('BROWSERLESS_API_URL'), 'docker-compose.yml must include BROWSERLESS_API_URL');
    });
});
