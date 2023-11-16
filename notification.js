const superagent = require('superagent');


async function push_notificaton(action, asset, price, value) {
    const jsonBody = {
        "P": price,
        "V": value
    }
    jsonBody[action] = asset
    const res = await superagent
        .post(`https://maker.ifttt.com/trigger/bot/json/with/key/OCLylkQySqhZP4AmgxyDX`)
        .send(jsonBody)
}
exports.push_notificaton = push_notificaton