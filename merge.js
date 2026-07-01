const fs = require('fs');

let template = fs.readFileSync('do_an_tot_nghiep.tex', 'utf8');
let raw = fs.readFileSync('baocao_latex_raw.tex', 'utf8');

// The raw file contains cover pages, summary, abstract, TOC which we want to clean up.
// We will extract from "Lời nói đầu" onwards, skip the manual TOC, and keep the main content.

let contentStartIndex = raw.indexOf('\\chapter*{MỞ ĐẦU}');
let preContent = raw.substring(0, contentStartIndex);
let mainContent = raw.substring(contentStartIndex);

// Find indices
let loiNoiDauIndex = preContent.indexOf('Lời nói đầu');
let camDoanIndex = preContent.indexOf('\\chapter*{Cam đoan}');
let mucLucIndex = preContent.indexOf('Mục lục\n\n\t\n\nLời nói đầu');
if (mucLucIndex === -1) mucLucIndex = preContent.indexOf('Mục lục');

let cleanedPreContent = '';
if (loiNoiDauIndex !== -1 && camDoanIndex !== -1) {
    cleanedPreContent += '\\chapter*{Lời nói đầu}\n\\addcontentsline{toc}{chapter}{Lời nói đầu}\n';
    cleanedPreContent += preContent.substring(loiNoiDauIndex + 'Lời nói đầu'.length, camDoanIndex);
    cleanedPreContent += preContent.substring(camDoanIndex, mucLucIndex);
}

let finalBody = cleanedPreContent + '\n' + mainContent;

// Replace the dummy content in template
let bodyStart = template.indexOf('\\chapter{Mở đầu}');
if (bodyStart === -1) {
    bodyStart = template.indexOf('\\end{document}');
}

let header = template.substring(0, bodyStart);
let finalTex = header + finalBody + '\n\\end{document}';

fs.writeFileSync('do_an_tot_nghiep.tex', finalTex);
console.log('Merge complete!');
