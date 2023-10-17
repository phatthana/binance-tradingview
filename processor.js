const store = require('./store.js')
const Decimal = require('decimal.js');
const binance = require('./binance.js');

const MIN_TAKING_PROFIT = new Decimal(2.5)
const MAX_CUTLOSS_PROFIT = new Decimal(80.0)

async function check_value() {
    const cache_data = await store.get_asset()
    if (!cache_data) return;

    const symbol = cache_data.split(':')[0]
    const quantity = new Decimal(cache_data.split(':')[1])
    const buyingValue = new Decimal(cache_data.split(':')[2])

    const price = new Decimal(await binance.get_price(symbol))
    // console.log(price)
    const currentValue = price.mul(quantity)
    // console.log(buyingValue)
    // console.log(currentValue)
    const profitLoss = currentValue.sub(buyingValue)
    const profit = new Decimal(Math.max(0, profitLoss))

    let cacheProfit = await store.get_max_value(symbol)
    let maxProfit = new Decimal(0);
    if (cacheProfit !== null) {
        maxProfit = new Decimal(cacheProfit.split(':')[2])
    }

    if (profit > maxProfit) {
        await store.set_max_value(symbol, profit)
    } else {

        const maxProfitPercent = maxProfit.div(buyingValue).mul(100)
        console.log(`max profit (%): ${maxProfitPercent}`)
        const profitDiffFormMaxPercent = profit.div(maxProfit).mul(100)
        console.log(`profit diff from max(%): ${profitDiffFormMaxPercent}`)
        if (maxProfitPercent < MIN_TAKING_PROFIT) return;


        if (profitDiffFormMaxPercent < MAX_CUTLOSS_PROFIT) {
            console.log('PROFIT CUT LOSS!!!')
            await binance.sell(symbol)
        }

    }

}

exports.check_value = check_value
