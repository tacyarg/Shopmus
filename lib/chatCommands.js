var assert = require('assert')
var Promise = require('bluebird')
var lodash = require('lodash')

module.exports = function (libs) {
    var methods = {
        '!help': Promise.method(function () {
            var stub = `*Available commands:*`

            var commands = lodash.keys(methods);
            lodash.each(commands, cmd => {
                stub += (" " + cmd);
            })

            return stub;
        }),
        // '!shop': function () {
        //     return libs.socket.getShopValue().then(total => `Current shop value: *$${total}*`)
        // },
        // '!online': function () {
        //     return libs.state.getOnlineCount().then(online => `*${online}* user(s) are currently online.`)
        // },
        // '!jackpot': function () {
        //     return libs.state.getJackpotStats('jackpots').then(stats => `*${stats.playerCount}* player(s) currently in jackpot with a total of *${stats.itemCount}* item(s) worth *$${stats.total}*`)
        // },
        // '!thirtymax': function () {
        //     return libs.state.getJackpotStats('thirtymax').then(stats => `*${stats.playerCount}* player(s) currently in thirtymax with a total of *${stats.itemCount}* item(s) worth *$${stats.total}*`);
        // },
        // '!coinflip': function () {
        //     return libs.state.getCoinflipStats().then(stats => `*${stats.count}* coinflip(s) currently listed with a total value of *$${stats.total}*`)
        // },
        // '!promo': function () {
        //     return libs.state.getPromoStats().then(stats => `*${stats.count}* promo(s) currently listed with a total value of *$${stats.total}*`)
        // }
    }

    return Promise.method(function(command, params) {
        var cmd = methods[command];
        assert(cmd, `command not found: ${command}`)
        console.log('Running command:', command);
        return cmd(params);
    });
}