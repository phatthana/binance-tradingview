const Decimal = require('decimal.js');
const API = require('kucoin-node-sdk');
API.init({
    baseUrl: 'https://api.kucoin.com',
    apiAuth: {
        key: process.env.KUCOIN_KEY,
        secret: process.env.KUCOIN_SECRET,
        passphrase: process.env.KUCOIN_PASSPHRASE,
    },
});

const FIAT = 'USDT'
const MIN_TRADE = 30

async function buy(symbol, minTrade=MIN_TRADE) {
    let fiatBalance = new Decimal(await _getBalance('USDT'))
    if (fiatBalance < minTrade) return;

    try {
        const oID = parseInt(new Date().getTime() / 1000)
        const tradeFund = new Decimal(minTrade)
        let response = await API.rest.Trade.Orders.postOrder({
            clientOid: `${oID}`,
            side: 'buy',
            symbol: symbol.replace(FIAT, `-${FIAT}`),
            type: 'market',
            funds: tradeFund.toString()
        })
        console.log(response);
    } catch (error) {
        console.log(error);
    }
    
}

async function sell(symbol) {
    const asset = symbol.replace('USDT', '')
    let balanceAsset = new Decimal(await _getBalance(asset))
    // const lotSize = await _getLotSize(symbol)
    // const lotStepSize = new Decimal(lotSize.stepSize)
    // const lotMinQty = new Decimal(lotSize.minQty)
    // if (balanceAsset < lotMinQty) {
    //     console.log(`WARNING: NOT ENOUGH AMOUNT: ${balanceAsset}, MIN: ${lotMinQty}`);
    //     return;
    // }

    // try {
    //     let quantity = balanceAsset.sub(balanceAsset.mod(lotStepSize))
    //     let order = await client.newOrder(symbol, 'SELL', 'MARKET', {quantity})    
    //     console.log(`${symbol} RECEV BUSD ${order.data.cummulativeQuoteQty}`);
    // } catch (error) {
    //     console.log(error);
    // }
}

async function _getBalance(asset) {
    
    let response = await API.rest.User.Account.getAccountsList({type: 'trade'})
    let balances = response.data
    // console.log(response);
    for (const balance of balances) {
        if (asset == balance.currency) {
            return parseFloat(balance.available)
        }
    }
    return 0
}

async function _getLotSize(symbol) {
    let exchangeInfo = await client.exchangeInfo({symbol})
    let symbolData = exchangeInfo.data.symbols[0]
    let filters = symbolData.filters
    for (const f of filters) {
        if (f.filterType === 'LOT_SIZE') {
            return f
        }
    }
}

exports.buy = buy
exports.sell = sell