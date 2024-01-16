const Decimal = require('decimal.js');
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.BINANCE_FUTURE_API_KEY,
    APISECRET: process.env.BINANCE_FUTURE_API_SECRET,
    test: process.env.BINANCE_FUTURE_TEST || false,
});

// import Binance from 'binance-api-node'
// const Binance = require('binance-api-node').default
// const client = Binance({
//     apiKey: process.env.BINANCE_FUTURE_API_KEY,
//     apiSecret: process.env.BINANCE_FUTURE_API_SECRET,
//     httpFutures: 'https://testnet.binancefuture.com'
// })
// Decimal.set({ precision: 1, rounding: 1, include_zeros: false })

const marginPercent = new Decimal(10 / 100)
var TP_PRICE = -1
var LAST_PRICE = -1
var LEVERAGE = 80
var longProfitPercent = new Decimal(1.00126)
var shortProfitPercent = new Decimal(0.99874)
var longStopPercent = new Decimal(0.995)
var shortStopPercent = new Decimal(1.005)

let ORDER_IN_PROGRESS = false



async function long(asset, price, test = false) {
    if (ORDER_IN_PROGRESS) return;

    ORDER_IN_PROGRESS = true
    let position = await _getOpenPosition()
    if (position) {
        _closePosition(position)
    }

    const symbol = `${asset}USDT`
    await _setLeverage(symbol, LEVERAGE)
    const tradingCap = await _getTradingCap()
    var _price = new Decimal(price)

    var quantity = tradingCap.div(_price)
    var limitPrice = _price.mul(longProfitPercent)
    console.log(`Buying ${quantity.toFixed(3)} ${asset} / ${_price.toFixed(1)} -> ${limitPrice.toFixed(1)}`)

    // var longOrder = await binance.futuresBuy(symbol, quantity.toFixed(3), _price.toFixed(1), { type: 'TAKE_PROFIT' })
    var longOrder = await binance.futuresMarketBuy('BTCUSDT', quantity.toFixed(3), { newOrderRespType: 'RESULT' })
    console.log("LONG ORDER", longOrder)

    let positionentryPrice = new Decimal(longOrder.avgPrice)
    let positionAmt = new Decimal(longOrder.cumQty)
    let tpPrice = positionentryPrice.mul(longProfitPercent)
    var stopPrice = positionentryPrice.mul(longStopPercent)
    console.log(tpPrice, positionentryPrice, stopPrice)
    let shortOrder = await binance.futuresSell(symbol, positionAmt.abs().toFixed(3), price = tpPrice.toFixed(1), params = { timeInForce: 'GTC' })
    console.log("TP", shortOrder)
    let stopOrder = await binance.futuresSell(symbol, positionAmt.abs().toFixed(3), price = stopPrice.toFixed(1), params = { timeInForce: 'GTC' })
    console.log("SL", stopOrder)
    ORDER_IN_PROGRESS = false
}

async function short(asset, price, test = false) {
    if (ORDER_IN_PROGRESS) return;

    ORDER_IN_PROGRESS = true
    const symbol = `${asset}USDT`
    let position = await _getOpenPosition()
    if (position) {
        _closePosition(position)
    }

    console.log(`SYMBOL ${symbol}`)
    await _setLeverage(symbol, LEVERAGE)
    const tradingCap = await _getTradingCap()
    var _price = new Decimal(price)

    var quantity = tradingCap.div(price)
    var limitPrice = _price.mul(shortProfitPercent)
    console.log(`Selling ${quantity.toFixed(3)} ${asset} / ${_price.toFixed(1)} -> ${limitPrice.toFixed(1)}`)

    var shortOrder = await binance.futuresMarketSell('BTCUSDT', quantity.toFixed(3), { newOrderRespType: 'RESULT' })
    console.log("SHORT ORDER", shortOrder)

    let positionentryPrice = new Decimal(shortOrder.avgPrice)
    let positionAmt = new Decimal(longOrder.cumQty)
    var tpPrice = positionentryPrice.mul(shortProfitPercent)
    var stopPrice = positionentryPrice.mul(shortStopPercent)
    console.log(tpPrice, positionentryPrice, stopPrice)
    let longOrder = await binance.futuresBuy(symbol, positionAmt.abs().toFixed(3), price = tpPrice.toFixed(1), params = { timeInForce: 'GTC' })
    console.log("TP", longOrder)
    let stopOrder = await binance.futuresBuy(symbol, positionAmt.abs().toFixed(3), price = stopPrice.toFixed(1), params = { timeInForce: 'GTC' })
    console.log("SL", stopOrder)
    ORDER_IN_PROGRESS = false
}

async function _closePosition(position) {
    let symbol = position.symbol
    let positionAmt = new Decimal(position.positionAmt)

    if (positionAmt > 0) { // LONG
        await binance.futuresMarketSell(symbol, positionAmt.abs().toFixed(3))
    } else { //SHORT
        await binance.futuresMarketBuy(symbol, positionAmt.abs().toFixed(3))
    }
    console.info(await binance.futuresCancelAll("BTCUSDT"));
}

async function _getTradingCap() {
    const usdtBalance = new Decimal(await _getBalance())
    return new Decimal(marginPercent * usdtBalance * LEVERAGE)
}

async function _getBalance(asset = 'USDT') {
    // const balances = await client.futuresAccountBalance()
    const balances = await binance.futuresBalance()
    return balances.filter((b) => b.asset == asset)[0].balance;
}

async function _setLeverage(symbol = 'BTCUSDT', leverage) {
    await binance.futuresLeverage(symbol, leverage)
    // await client.futuresLeverage({
    //     symbol: symbol,
    //     leverage: leverage,
    // })
}



async function _getOpenPosition() {
    let position_data = await binance.futuresPositionRisk({ symbol: 'BTCUSDT' }), markets = Object.keys(position_data);
    for (let market of markets) {
        let position = position_data[market], size = Number(position.positionAmt);
        if (size == 0) continue;
        return position
    }
    return null
}

async function _getOpenOrder() {
    let openOrder = await binance.futuresOpenOrders()
    return openOrder
}

async function checkPosition() {
    if (ORDER_IN_PROGRESS) return;
    // console.info(await binance.futuresExchangeInfo());
    let position = await _getOpenPosition()
    if (!position) {
        let openOrders = await _getOpenOrder()
        if (Object.keys(openOrders).length > 0) {
            console.log('CANCEL ALL ORDERS')
            await binance.futuresCancelAll("BTCUSDT")
        }
        return;
    }

    let openOrders = await _getOpenOrder()
    // console.log("openOrder", openOrders)
    if (Object.keys(openOrders).length > 0) return;

    console.log("position", position)
    let symbol = position.symbol
    let positionAmt = new Decimal(position.positionAmt)
    let positionentryPrice = new Decimal(position.entryPrice)


    // if (positionAmt > 0) { // LONG
    //     let tpPrice = positionentryPrice.mul(longProfitPercent)
    //     var stopPrice = positionentryPrice.mul(longStopPercent)
    //     console.log(tpPrice, positionentryPrice, stopPrice)
    //     let shortOrder = await binance.futuresSell(symbol, positionAmt.toFixed(3), price = tpPrice.toFixed(1), params = { type: 'TAKE_PROFIT', stopPrice: tpPrice.toFixed(1), reduceOnly: false })
    //     let stopOrder = await binance.futuresSell(symbol, positionAmt.abs().toFixed(3), price = stopPrice.toFixed(1), params = { type: 'STOP', stopPrice: stopPrice.toFixed(1) })
    //     console.log("TP SHORT ORDER", shortOrder)
    // } else { //SHORT
    //     var tpPrice = positionentryPrice.mul(shortProfitPercent)
    //     var stopPrice = positionentryPrice.mul(shortStopPercent)
    //     console.log(tpPrice, positionentryPrice, stopPrice)
    //     let longOrder = await binance.futuresBuy(symbol, positionAmt.abs().toFixed(3), price = tpPrice.toFixed(1), params = { type: 'TAKE_PROFIT', stopPrice: tpPrice.toFixed(1), reduceOnly: false })
    //     let stopOrder = await binance.futuresBuy(symbol, positionAmt.abs().toFixed(3), price = stopPrice.toFixed(1), params = { type: 'STOP', stopPrice: stopPrice.toFixed(1) })

    //     console.log("TP LONG ORDER", longOrder)
    // }

}

setInterval(checkPosition, 3000)

exports.long = long
exports.short = short