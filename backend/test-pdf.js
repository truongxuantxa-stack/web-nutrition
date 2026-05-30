require('dotenv').config();
const { getReportData } = require('./services/report.service');
const { generateReportPDF } = require('./services/pdf.service');
const { User } = require('./models');
const fs = require('fs');

async function test() {
    try {
        const user = await User.findOne({ where: { email: 'vankhanh12@gmail.com' } });
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log('Fetching report data for user', user.id);
        const data = await getReportData(user.id, 'month');
        console.log('Generating PDF...');
        const doc = generateReportPDF(data);
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync('test_report.pdf', buffer);
            console.log('Saved to test_report.pdf. Size:', buffer.length);
            
            const range = doc.bufferedPageRange();
            console.log('Pages generated:', range.count);
        });
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
