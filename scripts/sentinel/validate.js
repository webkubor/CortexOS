import fs from 'fs';
import path from 'path';

const skillPath = process.cwd();
const skillMdPath = path.join(skillPath, 'SKILL.md');
const packageJsonPath = path.join(skillPath, 'package.json');

console.log('🔍 Starting Skill Validation...');

// 1. Check SKILL.md
if (!fs.existsSync(skillMdPath)) {
    console.error('❌ Error: SKILL.md missing!');
    process.exit(1);
}

const skillMd = fs.readFileSync(skillMdPath, 'utf-8');
if (!skillMd.startsWith('---')) {
    console.error('❌ Error: SKILL.md missing Frontmatter!');
    process.exit(1);
}

// 2. Check for Tables in Cinematic Storyboard (Specific Rule)
if (skillMd.includes('cinematic-storyboard') && skillMd.includes('| --- |')) {
    console.error('❌ Error: Tables are forbidden in Cinematic Storyboard scripts! Use "Gu Qiyue" hierarchical titles.');
    process.exit(1);
}

// 3. Check for specific assets
if (skillMd.includes('nanobanana') && !fs.existsSync(path.join(skillPath, 'scripts/setup-mcp.sh'))) {
    console.warn('⚠️ Warning: nanobanana mentioned but scripts/setup-mcp.sh missing.');
}

console.log('✅ Validation passed!');
