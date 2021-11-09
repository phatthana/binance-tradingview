const Decimal = require('decimal.js');
const { Spot } = require('@binance/connector')
const client = new Spot(process.env.API_KEY, process.env.API_SECRET);

async function buy(symbol, min_usd=30) {
    let balanceBUSD = await _getBalance('BUSD')
    if (balanceBUSD < min_usd) return;

    try {
        let order = await client.newOrder(symbol, 'BUY', 'MARKET', {quoteOrderQty: min_usd,})
        console.log(`${symbol} SPEND BUSD ${order.data.cummulativeQuoteQty}`);
    } catch (error) {
        console.log(error);
    }
    
}

async function sell(symbol) {
    const asset = symbol.replace('BUSD', '')
    let balanceAsset = new Decimal(await _getBalance(asset))
    const lotSize = await _getLotSize(symbol)
    const lotStepSize = new Decimal(lotSize.stepSize)
    const lotMinQty = new Decimal(lotSize.minQty)
    if (balanceAsset < lotMinQty) {
        console.log(`WARNING: NOT ENOUGH AMOUNT: ${balanceAsset}, MIN: ${lotMinQty}`);
        return;
    }

    try {
        let quantity = balanceAsset.sub(balanceAsset.mod(lotStepSize))
        let order = await client.newOrder(symbol, 'SELL', 'MARKET', {quantity})    
        console.log(`${symbol} RECEV BUSD ${order.data.cummulativeQuoteQty}`);
    } catch (error) {
        console.log(error);
    }
    
    
}

async function _getBalance(asset) {
    let account = await client.account()
    let balances = account.data.balances
    for (const balance of balances) {
        if (asset == balance.asset) {
            return parseFloat(balance.free)
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