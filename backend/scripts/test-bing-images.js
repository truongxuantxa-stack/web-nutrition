const https = require('https');

const searchBingImage = (query) => {
    return new Promise((resolve) => {
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query + ' món ăn')}&form=HDRSC2`;
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/murl&quot;:&quot;(.*?)&quot;/);
                if (match && match[1]) {
                    resolve(match[1]);
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
};

searchBingImage('Phở Gà').then(url => console.log('Result:', url));
searchBingImage('Bánh Mì Pate').then(url => console.log('Result:', url));
searchBingImage('Ức gà thô').then(url => console.log('Result:', url));
