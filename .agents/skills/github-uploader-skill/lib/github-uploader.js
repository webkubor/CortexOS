import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * GitHub 极速上传工具 (Node.js Native Fetch)
 * 用法: node upload.js <本地路径> [远程文件名]
 */

function loadConfig() {
    const secretPath = path.join(os.homedir(), 'Documents', 'memory', 'secrets', 'github-uploader.json');
    if (fs.existsSync(secretPath)) {
        try {
            const raw = fs.readFileSync(secretPath, 'utf-8');
            const cfg = JSON.parse(raw);
            return {
                token: cfg.token,
                repo: cfg.repo || 'webkubor/upic-images'
            };
        } catch (e) {
            console.error('❌ 读取 secrets 失败:', e.message);
        }
    }
    console.error('❌ 未找到 ~/Documents/memory/secrets/github-uploader.json');
    process.exit(1);
}

const { token: TOKEN, repo: REPO } = loadConfig();

async function run() {
    const localPath = process.argv[2];
    if (!localPath || !fs.existsSync(localPath)) {
        console.error("❌ 错误: 请提供有效的本地文件路径。");
        process.exit(1);
    }

    const fileName = process.argv[3] || `img_${Math.floor(Date.now() / 1000)}${path.extname(localPath)}`;
    const remotePath = `assets/${fileName}`;

    console.log(`🚀 正在推流: ${path.basename(localPath)} -> ${REPO}/${remotePath}...`);
    
    const imageBuffer = fs.readFileSync(localPath);
    const content = imageBuffer.toString('base64');

    const url = `https://api.github.com/repos/${REPO}/contents/${remotePath}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Auto-upload from Gemini at ${new Date().toISOString()}`,
            content: content
        })
    });

    const data = await response.json();

    if (response.ok) {
        console.log(`\n✅ 上传成功!`);
        console.log(`🔗 Raw: https://raw.githubusercontent.com/${REPO}/main/${remotePath}`);
        console.log(`⚡ CDN: https://cdn.jsdelivr.net/gh/${REPO}@main/${remotePath}`);
    } else {
        console.log(`\n❌ 上传失败 [${response.status}]: ${data.message}`);
    }
}

run().catch(console.error);
