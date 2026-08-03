const fs = require('fs');
const path = require('path');

function scanDir(dir, ignores = [], allowExtensions = ['.js', '.jsx', '.md', '.json']) {
    let result = '';
    if (!fs.existsSync(dir)) return result;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ignores.includes(file)) continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            result += scanDir(fullPath, ignores, allowExtensions);
        } else {
            const ext = path.extname(file);
            if (allowExtensions.includes(ext)) {
                // ignore large build files
                if (file === 'package-lock.json') continue;
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    result += `\n\n======================================================\n`;
                    result += `FILE: ${fullPath.replace(/\\/g, '/')}\n`;
                    result += `======================================================\n\n`;
                    result += content;
                } catch(e) {}
            }
        }
    }
    return result;
}

const rootIgnores = ['node_modules', '.git', 'public', 'dist', 'build', 'images', 'uploads'];
const rootMdFiles = [
    'food_scoring_algorithm_report.md', 
    'health_insights_algorithm_report.md', 
    'hybrid_meal_algorithm_report.md', 
    'report_hybrid_scanner.md', 
    'algorithms_report.md', 
    'nhat_ky_phat_trien_do_an.md',
    'claude.md'
];

let backendTxt = scanDir('./backend', rootIgnores, ['.js', '.json', '.md']);
for(const md of rootMdFiles) {
    if(fs.existsSync(md)) {
        backendTxt += `\n\n======================================================\n`;
        backendTxt += `FILE: ${md}\n`;
        backendTxt += `======================================================\n\n`;
        backendTxt += fs.readFileSync(md, 'utf8');
    }
}
fs.writeFileSync('Backend_NotebookLM.txt', backendTxt);

let frontendTxt = scanDir('./frontend', rootIgnores, ['.js', '.jsx', '.json', '.md']);
fs.writeFileSync('Frontend_NotebookLM.txt', frontendTxt);

console.log('Successfully generated NotebookLM files!');
