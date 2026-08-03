const https = require('https');
const url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyD8QqgAbjtefiT87kuv2zHY-62l6XHsR-A&cx=90b1658a165914439&q=test&searchType=image';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE:', data);
    });
}).on('error', (err) => {
    console.error('ERROR:', err.message);
});
