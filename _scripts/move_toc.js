const fs = require('fs');

let content = fs.readFileSync('do_an_tot_nghiep.tex', 'utf8');

// 1. Remove the old TOC block
let oldTocRegex = /\\clearpage\s*\\pagenumbering{roman}\s*\\renewcommand{\\contentsname}{\\centering MỤC LỤC}\s*\\addcontentsline{toc}{chapter}{Mục lục}\s*\\tableofcontents\s*\\clearpage\s*\\pagenumbering{arabic}\s*\\addtocontents{toc}{\\protect\\hfill\\textbf{Trang}\\par}\s*/;
content = content.replace(oldTocRegex, '');

// 2. Insert \pagenumbering{roman} before Lời nói đầu
let loiNoiDauRegex = /\\chapter\*{Lời nói đầu}/;
content = content.replace(loiNoiDauRegex, '\\clearpage\n\\pagenumbering{roman}\n\n\\chapter*{Lời nói đầu}');

// 3. Insert TOC before MỞ ĐẦU
let newTocBlock = `\\clearpage
\\renewcommand{\\contentsname}{\\centering MỤC LỤC}
\\addcontentsline{toc}{chapter}{Mục lục}
\\tableofcontents
\\clearpage
\\pagenumbering{arabic}
\\addtocontents{toc}{\\protect\\hfill\\textbf{Trang}\\par}

\\chapter*{MỞ ĐẦU}`;

let moDauRegex = /\\chapter\*{MỞ ĐẦU}/;
content = content.replace(moDauRegex, newTocBlock);

fs.writeFileSync('do_an_tot_nghiep.tex', content);
console.log('Moved TOC successfully!');
