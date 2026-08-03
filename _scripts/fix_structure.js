const fs = require('fs');

let content = fs.readFileSync('do_an_tot_nghiep.tex', 'utf8');

// 1. Fix Chapters
// \chapter*{CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI} -> \chapter{TỔNG QUAN ĐỀ TÀI}
content = content.replace(/\\chapter\*{CHƯƠNG\s+\d+\.?\s*(.*?)}/gi, '\\chapter{$1}');
// Also remove any manually added \addcontentsline for these chapters
content = content.replace(/\\addcontentsline{toc}{chapter}{CHƯƠNG\s+\d+\.?\s*(.*?)}\n/gi, '');

// 2. Fix Sections
// \textbf{1.1. Tổng quan bài toán} -> \section{Tổng quan bài toán}
content = content.replace(/\\textbf{(\d+\.\d+)\.?\s*(.*?)}/g, '\\section{$2}');

// 3. Fix Subsections
// \textbf{1.1.1. Đặc điểm bài toán} -> \subsection{$2}
content = content.replace(/\\textbf{(\d+\.\d+\.\d+)\.?\s*(.*?)}/g, '\\subsection{$2}');

// 4. Update Preamble to add tocloft and update chapter numbering
const tocloftConfig = `
\\usepackage[titles]{tocloft}
\\renewcommand{\\cftchapleader}{\\cftdotfill{\\cftdotsep}}
\\renewcommand{\\cftchappresnum}{Chương }
\\setlength{\\cftchapnumwidth}{6em}

\\renewcommand{\\thechapter}{\\Roman{chapter}}
\\renewcommand{\\thesection}{\\arabic{chapter}.\\arabic{section}}
\\renewcommand{\\thesubsection}{\\arabic{chapter}.\\arabic{section}.\\arabic{subsection}}
\\renewcommand{\\thefigure}{\\arabic{chapter}.\\arabic{figure}}
\\renewcommand{\\thetable}{\\arabic{chapter}.\\arabic{table}}
\\renewcommand{\\theequation}{\\arabic{chapter}.\\arabic{equation}}
`;

if (!content.includes('tocloft')) {
    content = content.replace('\\usepackage{titlesec}', tocloftConfig + '\n\\usepackage{titlesec}');
}

// Update \titleformat for \chapter to include "Chương I."
content = content.replace(
    '\\titleformat{\\chapter}[block]{\\normalfont\\fontsize{14pt}{16.8pt}\\bfseries\\filcenter}{}{0pt}{}',
    '\\titleformat{\\chapter}[block]{\\normalfont\\fontsize{14pt}{16.8pt}\\bfseries\\filcenter}{\\chaptername\\ \\thechapter.}{1em}{\\MakeUppercase}'
);

// 5. Update TOC section (add \pagenumbering and "Trang")
let tocRegex = /\\tableofcontents\s*\\newpage/;
let newToc = `\\clearpage
\\pagenumbering{roman}
\\renewcommand{\\contentsname}{\\centering MỤC LỤC}
\\addcontentsline{toc}{chapter}{Mục lục}
\\tableofcontents
\\clearpage
\\pagenumbering{arabic}
\\addtocontents{toc}{\\protect\\hfill\\textbf{Trang}\\par}
`;
content = content.replace(tocRegex, newToc);

fs.writeFileSync('do_an_tot_nghiep.tex', content);
console.log('Fixed structure successfully!');
