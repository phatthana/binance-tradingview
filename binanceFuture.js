const Decimal = require('decimal.js');
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.BINANCE_FUTURE_API_KEY,
    APISECRET: process.env.BINANCE_FUTURE_API_SECRET,
    test: true
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
var longProfitPercent = new Decimal(1.00125)
var shortProfitPercent = new Decimal(0.99875)




async function long(asset, price, test = false) {
    // console.info(await binance.futuresOpenOrders("BTCUSDT"));
    // return;
    const symbol = `${asset}USDT`
    await _setLeverage(symbol, LEVERAGE)
    const tradingCap = await _getTradingCap()
    var _price = new Decimal(price)

    var quantity = tradingCap.div(_price)
    var limitPrice = _price.mul(longProfitPercent)
    console.log(`Buying ${quantity.toFixed(3)} ${asset} / ${_price.toFixed(1)} -> ${limitPrice.toFixed(1)}`)

    // var longOrder = await binance.futuresBuy(symbol, quantity.toFixed(3), _price.toFixed(1), { type: 'TAKE_PROFIT' })
    var longOrder = await binance.futuresMarketBuy('BTCUSDT', quantity.toFixed(3), { newOrderRespType: 'RESULT' })
    console.log(longOrder)
    // if (!longOrder['price']) {
    //     longOrder = await binance.futuresMarketBuy('BTCUSDT', quantity.toFixed(3), { newOrderRespType: 'RESULT' })
    //     _price = new Decimal(longOrder.avgPrice)
    //     console.log(`Long at market price: ${_price}`)
    //     limitPrice = _price.mul(longProfitPercent)
    // }
    _price = new Decimal(longOrder.avgPrice)
    console.log(`Long at market price: ${_price}`)
    limitPrice = _price.mul(longProfitPercent)
    var shortOrder = await binance.futuresSell(symbol, quantity.toFixed(3), limitPrice.toFixed(1))
    console.log(shortOrder)
}

async function short(asset, price, test = false) {
    const symbol = `${asset}USDT`
    console.log(`SYMBOL ${symbol}`)
    await _setLeverage(symbol, LEVERAGE)
    const tradingCap = await _getTradingCap()
    var _price = new Decimal(price)

    var quantity = tradingCap.div(price)
    var limitPrice = _price.mul(shortProfitPercent)
    console.log(`Selling ${quantity.toFixed(3)} ${asset} / ${_price.toFixed(1)} -> ${limitPrice.toFixed(1)}`)

    // var shortOrder = await binance.futuresSell(symbol, quantity.toFixed(3), _price.toFixed(1), { type: 'TAKE_PROFIT' })
    var shortOrder = await binance.futuresMarketSell('BTCUSDT', quantity.toFixed(3), { newOrderRespType: 'RESULT' })
    console.log(shortOrder)
    // if (!shortOrder['price']) {
    //     shortOrder = await binance.futuresMarketSell('BTCUSDT', quantity.toFixed(3), { newOrderRespType: 'RESULT' })
    //     _price = new Decimal(shortOrder.avgPrice)
    //     console.log(`Short at market price: ${_price}`)
    //     limitPrice = _price.mul(shortProfitPercent)
    // }
    _price = new Decimal(shortOrder.avgPrice)
    console.log(`Short at market price: ${_price}`)
    limitPrice = _price.mul(shortProfitPercent)
    console.log(`take profit at: ${limitPrice.toFixed(1)}`)
    var longOrder = await binance.futuresBuy(symbol, quantity.toFixed(3), limitPrice.toFixed(1))
    console.log(longOrder)
    // [Object: null prototype] {
    //     orderId: 3552445339,
    //     symbol: 'BTCUSDT',
    //     status: 'FILLED',
    //     clientOrderId: 'peP3r3JMqc52UHLiDTK2wD',
    //     price: '0.00',
    //     avgPrice: '43676.62353',
    //     origQty: '0.034',
    //     executedQty: '0.034',
    //     cumQty: '0.034',
    //     cumQuote: '1485.00520',
    //     timeInForce: 'GTC',
    //     type: 'MARKET',
    //     reduceOnly: false,
    //     closePosition: false,
    //     side: 'SELL',
    //     positionSide: 'BOTH',
    //     stopPrice: '0.00',
    //     workingType: 'CONTRACT_PRICE',
    //     priceProtect: false,
    //     origType: 'MARKET',
    //     priceMatch: 'NONE',
    //     selfTradePreventionMode: 'NONE',
    //     goodTillDate: 0,
    //     updateTime: 1701964407028
    //   }


    // const avgPrice = new Decimal(order.avgPrice)
    // _updateOrder(order.orderId, order.side, avgPrice.mul(1 - 0.00125))

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


async function _updateOrder(orderId, side, takeProfitPrice) {
    console.log(`Update ${side} Order[${orderId}] TP: ${takeProfitPrice}`)
}


// binance.futuresMiniTickerStream('BTCUSDT', (trades) => {
//     // let { e: eventType, E: eventTime, s: symbol, p: price, q: quantity, m: maker, a: tradeId } = trades;
//     // console.log(trades)
//     LAST_PRICE = trades.close
//     console.log(LAST_PRICE)

// })


exports.long = long
exports.short = short