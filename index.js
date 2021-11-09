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
        // Buy:50 BINANCE:ETH
        // Sell:50 BINANCE:ETH
        const command = req.rawBody.split(" ")
        const side = command[0].split(":")
        const amount = side.length > 1? side[1]: 30
        const ticker = command[1].split(":")
        if (side[0] === 'Buy') {
            binance.buy(ticker[1], amount)
        } else if (side[0] === 'Sell') {
            binance.sell(ticker[1])
        }
        res.send('ok')
    });    
})
app.listen(3000)

