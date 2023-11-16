const fs = require('fs').promises;


const SYMBOL_FILE = './cache.txt'
const PROFIT_FILE = './profit.txt'

async function set_asset(symbol, quantity, value) {
    const data = `${symbol}:${quantity}:${value}`;
    // console.log(`cache set: ${data}`)
    await fs.writeFile(SYMBOL_FILE, data);
}

async function get_asset(symbol) {
    try {
        const data = await fs.readFile(SYMBOL_FILE, { encoding: 'utf8' });
        // console.log(`cache get: ${data}`)
        return data
    } catch (error) {
        return null
    }

}

async function set_max_value(symbol, value) {
    const epochNow = new Date().getTime()
    const data = `${symbol}:${epochNow}:${value}`;
    // console.log(`profit set: ${data}`)
    await fs.writeFile(PROFIT_FILE, data);
}

async function get_max_value(symbol) {
    try {
        const data = await fs.readFile(PROFIT_FILE, { encoding: 'utf8' });
        // console.log(`profit get: ${data}`)
        return data
    } catch (error) {
        return null
    }
}

async function purge() {
    // console.log(`cache purge`)
    try {
        await fs.unlink(SYMBOL_FILE);
    } catch (error) {

    }

    try {
        await fs.unlink(PROFIT_FILE);
    } catch (error) {

    }


}

exports.set_asset = set_asset
exports.get_asset = get_asset
exports.purge = purge
exports.set_max_value = set_max_value
exports.get_max_value = get_max_value