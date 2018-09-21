var socket = require('socket.io-client')('https://socket.csgofiesta.com');
var Promise = require('bluebird')
var statesync = require('statesync')
var lodash = require('lodash')

var isStarted = false;

socket.getAppState = function () {
  return Promise.fromCallback(done => {
    socket.emit("action", "getAppState", {}, done);
  }).then(serverState => {
    state = statesync(serverState)
    socket.on("diff", state.patch);

    // console.log(lodash.keys(state.get()))

    state.getJackpotStats = Promise.method(function (name) {
      var jackpot = lodash.values(state.get(name))[0]
      return {
        total: jackpot.value.toFixed(2),
        playerCount: lodash.values(jackpot.players).length,
        itemCount: lodash.values(jackpot.items).length
      }
    })

    state.getCoinflipStats = Promise.method(function () {
      var coinflips = state.get('coinflips');
      return {
        total: lodash.reduce(coinflips, (memo, cf) => {
          memo += cf.value;
          return memo;
        }, 0).toFixed(2),
        count: lodash.values(coinflips).length
      }
    })

    state.getPromoStats = Promise.method(function () {
      var promos = state.get('promos')
      return {
        total: lodash.reduce(promos, (memo, promo) => {
          var sum = lodash.sumBy(promo.items, 'price')
          memo += sum;
          return memo;
        }, 0).toFixed(2),
        count: lodash.values(promos).length
      }
    })

    state.getOnlineCount = Promise.method(function () {
      return state.get('onlineCount')
    })

    return state;
  })
};

socket.getShopValue = function () {
  return Promise.fromCallback(done => {
    socket.emit("action", "listShopItemsCache", {}, done);
  }).then(shop => {
    return lodash.sumBy(shop, 'price').toFixed(2)
  })
}

module.exports = function () {
  return Promise.fromCallback(done => {
    socket.on('connect', () => {
      if (isStarted) return;
      isStarted = true;
      console.log('chipsgg socket connected')
      done(null, socket)
    });
    socket.on('error', done)
  })
}