const fs = require('fs');
let content = fs.readFileSync('do_an_tot_nghiep.tex', 'utf8');

// Thay thế \section{1. XYZ} thành \subsection{XYZ}
content = content.replace(/\\section{\d+\.\s*(.*?)}/g, '\\subsection{$1}');

fs.writeFileSync('do_an_tot_nghiep.tex', content);
console.log('Fixed subsections!');
