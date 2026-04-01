import fs from 'fs';
import path from 'path';
import os from 'os';

// 🛠️ R2 直连上传工具 (稳定版)

function loadConfig() {
    // 1. 优先环境变量
    if (process.env.CF_API_TOKEN) {
        return {
            accountId: process.env.CF_ACCOUNT_ID,
            apiToken: process.env.CF_API_TOKEN,
            bucketName: process.env.CF_BUCKET_NAME || 'images',
            domain: process.env.CF_DOMAIN || 'img.webkubor.online'
        };
    }

    // 2. fallback 到 secrets 文件
    const secretPath = path.join(os.homedir(), 'Documents', 'memory', 'secrets', 'r2-uploader.json');
    if (fs.existsSync(secretPath)) {
        try {
            const raw = fs.readFileSync(secretPath, 'utf-8');
            const cfg = JSON.parse(raw);
            return {
                accountId: cfg.accountId,
                apiToken: cfg.apiToken,
                bucketName: cfg.bucketName || 'images',
                domain: cfg.domain || 'img.webkubor.online'
            };
        } catch (e) {
            console.error('❌ 读取 secrets 文件失败:', secretPath, e.message);
        }
    }

    console.error('❌ 未找到 R2 配置。请设置环境变量 CF_API_TOKEN / CF_ACCOUNT_ID，或创建 ~/Documents/memory/secrets/r2-uploader.json');
    process.exit(1);
}

const { accountId: CF_ACCOUNT_ID, apiToken: CF_API_TOKEN, bucketName: BUCKET_NAME, domain: DOMAIN } = loadConfig();

async function run() {
    const localPath = process.argv[2];
    if (!localPath || !fs.existsSync(localPath)) {
        console.error('❌ 错误: 请提供有效的本地文件路径。');
        process.exit(1);
    }

    const fileName = process.argv[3] || path.basename(localPath);
    console.log(`🚀 正在直连 R2: ${path.basename(localPath)} -> ${fileName}...`);

    const fileBuffer = fs.readFileSync(localPath);
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${fileName}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${CF_API_TOKEN}`,
                'Content-Type': 'application/octet-stream'
            },
            body: fileBuffer
        });

        if (response.ok) {
            console.log('✅ 上传成功!');
            console.log(`🔗 R2 URL: https://${DOMAIN}/${fileName}`);
        } else {
            console.error('❌ 上传失败: ', await response.json());
        }
    } catch (err) {
        console.error('🚨 错误: ', err.message);
    }
}

run().catch(err => {
    console.error('🚨 未捕获错误: ', err);
    process.exit(1);
});
