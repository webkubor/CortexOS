
import fs from 'fs';
import path from 'path';

// 🛠️ R2 直连上传工具 (稳定版)
const CF_ACCOUNT_ID = '916ebb1b9f240bf4c8826021dd161692';
const CF_API_TOKEN = 'kpn1Q6_mOUTPB5sBdbw9azhQKcTrwdaKpaSjN2-5';
const BUCKET_NAME = 'images';
const DOMAIN = 'img.webkubor.online';

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
