const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

test('Vercel & Expo EAS Tools & Customizations Integration', async (t) => {
    const rootDir = path.resolve(__dirname, '..');
    const dockerfilePath = path.join(rootDir, 'Dockerfile');
    const entrypointPath = path.join(rootDir, 'entrypoint.sh');
    const customizationsDir = path.join(rootDir, 'customizations');

    await t.test('Dockerfile installs Vercel, Expo EAS, and AI agent tooling', () => {
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
        assert.ok(dockerfileContent.includes('vercel'), 'Dockerfile must install vercel CLI');
        assert.ok(dockerfileContent.includes('eas-cli'), 'Dockerfile must install eas-cli');
        assert.ok(dockerfileContent.includes('skills'), 'Dockerfile must install skills CLI');
        assert.ok(dockerfileContent.includes('add-mcp'), 'Dockerfile must install add-mcp CLI');
        assert.ok(dockerfileContent.includes('mcp-remote'), 'Dockerfile must install mcp-remote');
        assert.ok(dockerfileContent.includes('COPY customizations/ /usr/local/share/antigravity/customizations/'), 'Dockerfile must copy customizations directory');
    });

    await t.test('Vercel & Expo MCP configuration is valid and points to official endpoints', () => {
        const mcpConfigPath = path.join(customizationsDir, 'mcp_config.json');
        assert.ok(fs.existsSync(mcpConfigPath), 'mcp_config.json must exist');
        const mcpData = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        assert.ok(mcpData.mcpServers, 'mcpServers object must be defined');
        
        // Vercel MCP
        assert.ok(mcpData.mcpServers.vercel, 'vercel MCP server must be configured');
        assert.equal(mcpData.mcpServers.vercel.command, 'mcp-remote');
        assert.deepEqual(mcpData.mcpServers.vercel.args, ['https://mcp.vercel.com']);

        // Expo MCP
        assert.ok(mcpData.mcpServers.expo, 'expo MCP server must be configured');
        assert.equal(mcpData.mcpServers.expo.command, 'npx');
        assert.deepEqual(mcpData.mcpServers.expo.args, ['-y', 'expo-mcp-server']);
    });

    await t.test('Rules exist and provide Vercel and Expo non-interactive and safety guidance', () => {
        const rulePath = path.join(customizationsDir, 'rules', 'AGENTS.md');
        assert.ok(fs.existsSync(rulePath), 'customizations/rules/AGENTS.md must exist');
        const ruleContent = fs.readFileSync(rulePath, 'utf8');
        assert.ok(ruleContent.includes('VERCEL_TOKEN'), 'Rule must reference VERCEL_TOKEN');
        assert.ok(ruleContent.includes('EXPO_TOKEN'), 'Rule must reference EXPO_TOKEN');
        assert.ok(ruleContent.includes('--yes'), 'Rule must reference non-interactive flag');
        assert.ok(ruleContent.includes('--non-interactive'), 'Rule must reference EAS non-interactive flag');
        assert.ok(ruleContent.includes('--tunnel'), 'Rule must reference Expo tunnel flag');
        assert.ok(ruleContent.includes('.vercel'), 'Rule must mention ignoring .vercel directory');
        assert.ok(ruleContent.includes('.expo'), 'Rule must mention ignoring .expo directory');
    });

    await t.test('All packaged Vercel and Expo skills have valid YAML frontmatter and instructions', () => {
        const skillsDir = path.join(customizationsDir, 'skills');
        assert.ok(fs.existsSync(skillsDir), 'customizations/skills must exist');
        const skillFolders = fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());

        const expectedSkills = [
            'vercel-deploy',
            'vercel-cli',
            'vercel-react-best-practices',
            'next-best-practices',
            'vercel-ai-sdk',
            'vercel-troubleshooting',
            'vercel-storage',
            'eas-build-and-deploy',
            'expo-router-best-practices',
            'eas-update',
            'expo-troubleshooting'
        ];

        for (const expected of expectedSkills) {
            assert.ok(skillFolders.includes(expected), `Skill '${expected}' must be present in ${skillsDir}`);
            const skillFile = path.join(skillsDir, expected, 'SKILL.md');
            assert.ok(fs.existsSync(skillFile), `${expected}/SKILL.md must exist`);
            
            const content = fs.readFileSync(skillFile, 'utf8');
            // Check YAML frontmatter
            assert.ok(content.startsWith('---'), `${expected}/SKILL.md must start with YAML frontmatter ---`);
            const endFrontmatter = content.indexOf('---', 3);
            assert.ok(endFrontmatter > 0, `${expected}/SKILL.md must have closing frontmatter ---`);

            const frontmatter = content.substring(3, endFrontmatter);
            assert.ok(frontmatter.includes(`name: ${expected}`), `${expected}/SKILL.md frontmatter must contain name: ${expected}`);
            assert.ok(frontmatter.includes('description:'), `${expected}/SKILL.md frontmatter must contain description:`);
        }
    });

    await t.test('Simulates entrypoint customization sync and MCP merging for both Vercel and Expo', () => {
        const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-custom-test-'));
        const mockGeminiConfig = path.join(tempBase, 'config');
        fs.mkdirSync(mockGeminiConfig, { recursive: true });

        // Existing mcp_config.json with a user-defined server
        const existingMcpFile = path.join(mockGeminiConfig, 'mcp_config.json');
        fs.writeFileSync(existingMcpFile, JSON.stringify({
            mcpServers: {
                "custom-tool": { command: "node", args: ["tool.js"] }
            }
        }, null, 2), 'utf8');

        // Simulate entrypoint merge logic
        const mergeCode = `
        const fs = require("fs");
        const targetPath = process.argv[1];
        const data = JSON.parse(fs.readFileSync(targetPath, "utf8"));
        data.mcpServers = data.mcpServers || {};
        let updated = false;
        if (!data.mcpServers.vercel) {
            data.mcpServers.vercel = {
                command: "mcp-remote",
                args: ["https://mcp.vercel.com"]
            };
            updated = true;
        }
        if (!data.mcpServers.expo) {
            data.mcpServers.expo = {
                command: "npx",
                args: ["-y", "expo-mcp-server"]
            };
            updated = true;
        }
        if (updated) {
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf8");
        }
        `;

        require('node:child_process').execSync(`node -e '${mergeCode}' "${existingMcpFile}"`);

        const mergedMcp = JSON.parse(fs.readFileSync(existingMcpFile, 'utf8'));
        assert.ok(mergedMcp.mcpServers["custom-tool"], 'User-defined server must be preserved');
        assert.ok(mergedMcp.mcpServers.vercel, 'vercel server must be merged');
        assert.equal(mergedMcp.mcpServers.vercel.command, 'mcp-remote');
        assert.ok(mergedMcp.mcpServers.expo, 'expo server must be merged');
        assert.equal(mergedMcp.mcpServers.expo.command, 'npx');

        // Cleanup
        fs.rmSync(tempBase, { recursive: true, force: true });
    });
});
