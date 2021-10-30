const dotenv = require('dotenv');
dotenv.config();

const express = require('express')
const app = express()
const binance = require('./binance')

app.post('/log', function (req, res) {
    req.rawBody = '';
    req.setEncoding('utf8');
    
    req.on('data', function(chunk) { 
        req.rawBody += chunk;
    });
    
    req.on('end', function() {
        console.log(req.rawBody);
        res.send('ok')
    });    
})

app.post('/bot', async (req, res) => {
    req.rawBody = '';
    req.setEncoding('utf8');
    
    req.on('data', async (chunk) => { 
        req.rawBody += chunk;
    });
    
    req.on('end', async () => {
        console.log(req.rawBody);
        const ticker = req.rawBody.split(":")
        if (ticker[0] === 'BUY') {
            binance.buy(ticker[2])
        } else if (ticker[0] === 'SELL') {
            binance.sell(ticker[2])
        }
        res.send('ok')
    });    
})
app.listen(3000)

