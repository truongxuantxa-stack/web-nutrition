const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
    let dataBuffer = fs.readFileSync('test_report.pdf');
    try {
        let pages = [];
        const data = await pdf(dataBuffer, {
            pagerender: function(pageData) {
                return pageData.getTextContent().then(function(textContent) {
                    let text = '';
                    for (let item of textContent.items) {
                        text += item.str + ' ';
                    }
                    pages.push(text);
                    return text;
                });
            }
        });
        console.log('Total pages:', data.numpages);
        pages.forEach((p, i) => {
            console.log(`\n\n--- PAGE ${i+1} ---`);
            console.log(p.substring(0, 300));
            console.log('...');
            console.log(p.substring(p.length - 300));
        });
    } catch (e) {
        console.error(e);
    }
}
test();
