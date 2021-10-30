const { Spot } = require('@binance/connector')
const client = new Spot(process.env.API_KEY, process.env.API_SECRET);

async function buy(symbol) {
    const MIN_USD = 30
    let balanceBUSD = await _getBalance('BUSD')
    if (balanceBUSD < MIN_USD) return;

    try {
        let order = await client.newOrder(symbol, 'BUY', 'MARKET', {quoteOrderQty: MIN_USD,})
        console.log(`${symbol} SPEND BUSD ${order.data.cummulativeQuoteQty}`);
    } catch (error) {
        console.log(error);
    }
    
}

async function sell(symbol) {
    const asset = symbol.replace('BUSD', '')
    let balanceAsset = await _getBalance(asset)
    if (balanceAsset <= 0) return;

    try {
        let order = await client.newOrder(symbol, 'SELL', 'MARKET', {quantity: balanceAsset,})    
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

exports.buy = buy
exports.sell = sell