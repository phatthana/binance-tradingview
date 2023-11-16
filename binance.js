const Decimal = require('decimal.js');
const { Spot } = require('@binance/connector')
const client = new Spot(process.env.API_KEY, process.env.API_SECRET);
const store = require('./store.js')
const notification = require('./notification')

const MIN_PERCENT_ASSET = 0.60

async function get_price(symbol) {
    const tradingSymbol = symbol + "USDT"
    result = await client.tickerPrice(tradingSymbol)
    return result.data.price
}

async function buy(symbol, min_usd = 30, test = false) {
    let balanceUSD = await _getBalance('USDT')
    const tradingSymbol = symbol + "USDT"

    result = await client.tickerPrice(tradingSymbol)
    const lastPrice = result.data.price
    if (test) {
        console.log(`TEST BUY:${symbol} ${lastPrice}`)
        return
    }

    if (balanceUSD < min_usd) {
        console.log(`out of balance ${balanceUSD}`)
        return;
    }

    let buyingUSD = Math.max(min_usd, parseInt(MIN_PERCENT_ASSET * balanceUSD))
    console.log(`spending: ${buyingUSD} USD`)

    try {
        let order = await client.newOrder(tradingSymbol, 'BUY', 'MARKET', { quoteOrderQty: buyingUSD, })
        console.log(`${symbol} SPEND USD ${order.data.cummulativeQuoteQty} at price ~${lastPrice}`);
        await store.set_asset(symbol, order.data.executedQty, order.data.cummulativeQuoteQty)
        await notification.push_notificaton("BUY", symbol, lastPrice, order.data.cummulativeQuoteQty)
    } catch (error) {
        console.log(error);
    }

}

async function sell(symbol, test = false) {
    const asset = symbol.replace('USDT', '')
    const tradingSymbol = symbol + "USDT"

    result = await client.tickerPrice(tradingSymbol)
    const lastPrice = result.data.price

    let balanceAsset = new Decimal(await _getBalance(asset))

    if (test) {
        console.log(`TEST SELL:${symbol} ${lastPrice}`)
        return
    }
    const lotSize = await _getLotSize(tradingSymbol)
    const lotStepSize = new Decimal(lotSize.stepSize)
    const lotMinQty = new Decimal(lotSize.minQty)
    if (balanceAsset < lotMinQty) {
        console.log(`WARNING: NOT ENOUGH AMOUNT: ${balanceAsset}, MIN: ${lotMinQty}`);
        return;
    }

    try {
        let quantity = balanceAsset.sub(balanceAsset.mod(lotStepSize))
        let order = await client.newOrder(tradingSymbol, 'SELL', 'MARKET', { quantity })
        console.log(`${symbol} RECEV USD ${order.data.cummulativeQuoteQty} at price ~${lastPrice}`);
        await store.purge(symbol)
        await notification.push_notificaton("SELL", symbol, lastPrice, order.data.cummulativeQuoteQty)
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
    let exchangeInfo = await client.exchangeInfo({ symbol })
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
exports.get_price = get_price