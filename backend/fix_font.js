const fs = require('fs');
let code = fs.readFileSync('services/pdf.service.js', 'utf8');
code = code.split('doc.font(FONT_BOLD)').join("doc.font('Bold')");
code = code.split('doc.font(FONT_REGULAR)').join("doc.font('Regular')");
fs.writeFileSync('services/pdf.service.js', code);
console.log('Done');
