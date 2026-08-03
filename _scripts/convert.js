const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('baocao.md', 'utf8');

// Tạo thư mục images nếu chưa có
if (!fs.existsSync('images')) {
    fs.mkdirSync('images');
}

// 1. Trích xuất và lưu hình ảnh base64
let imgCounter = 1;
content = content.replace(/<img src="data:image\/(png|jpeg|jpg);base64,([^"]+)" \/>/g, (match, ext, base64Data) => {
    const filename = `images/image_${imgCounter}.${ext}`;
    fs.writeFileSync(filename, Buffer.from(base64Data, 'base64'));
    imgCounter++;
    return `\\begin{figure}[htbp]\n\\centering\n\\includegraphics[width=0.8\\textwidth]{${filename}}\n\\caption{Hình ${imgCounter-1}}\n\\end{figure}\n`;
});
// Catch images without closing slash
content = content.replace(/<img src="data:image\/(png|jpeg|jpg);base64,([^"]+)">/g, (match, ext, base64Data) => {
    const filename = `images/image_${imgCounter}.${ext}`;
    fs.writeFileSync(filename, Buffer.from(base64Data, 'base64'));
    imgCounter++;
    return `\\begin{figure}[htbp]\n\\centering\n\\includegraphics[width=0.8\\textwidth]{${filename}}\n\\caption{Hình ${imgCounter-1}}\n\\end{figure}\n`;
});

// 2. Xóa các thẻ <a> trống dùng cho bookmark của Word
content = content.replace(/<a id="[^"]+"><\/a>/g, '');
content = content.replace(/<a href="#[^"]+">(.*?)<\/a>/g, '$1');

// 3. Xử lý các Heading (Chương, phần)
// MỞ ĐẦU, KẾT LUẬN... (thường là thẻ h1)
content = content.replace(/<h1>(.*?)<\/h1>/g, '\n\\chapter*{$1}\n\\addcontentsline{toc}{chapter}{$1}\n');

// CHƯƠNG X. TÊN CHƯƠNG
content = content.replace(/<p><strong>CHƯƠNG \d+\.?\s*(.*?)<\/strong><\/p>/g, '\n\\chapter{$1}\n');

// 1.1. Tên section
content = content.replace(/<p><strong>\d+\.\d+\.?\s*(.*?)<\/strong><\/p>/g, '\n\\section{$1}\n');

// 1.1.1. Tên subsection
content = content.replace(/<p><strong>\d+\.\d+\.\d+\.?\s*(.*?)<\/strong><\/p>/g, '\n\\subsection{$1}\n');

// 4. Xử lý in đậm, in nghiêng
content = content.replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}');
content = content.replace(/<em>(.*?)<\/em>/g, '\\textit{$1}');

// 5. Xử lý danh sách
content = content.replace(/<ul>/g, '\\begin{itemize}\n');
content = content.replace(/<\/ul>/g, '\\end{itemize}\n');
content = content.replace(/<li>(.*?)<\/li>/g, '\\item $1\n');

content = content.replace(/<ol>/g, '\\begin{enumerate}\n');
content = content.replace(/<\/ol>/g, '\\end{enumerate}\n');

// 6. Chuyển đổi thẻ p thành đoạn văn mới
content = content.replace(/<p>(.*?)<\/p>/g, '$1\n\n');

// 7. Thoát các ký tự đặc biệt của LaTeX (tạm thời bỏ qua các thẻ HTML còn lại để tránh lỗi)
content = content.replace(/&/g, '\\&');
content = content.replace(/%/g, '\\%');
// Không escape _ vì nó được dùng trong code, ta chỉ escape _ khi nó đứng độc lập, nhưng để đơn giản ta escape toàn bộ _ thành \_ sau khi xóa HTML
content = content.replace(/_/g, '\\_');

// Xóa các thẻ HTML còn sót lại
content = content.replace(/<[^>]+>/g, '');

// Ghi ra file thô
fs.writeFileSync('baocao_latex_raw.tex', content);

console.log('Đã chuyển đổi xong!');
