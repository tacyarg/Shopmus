var lodash = require("lodash");
var Promise = require("bluebird");
var assert = require("assert");
var requestP = require("request-promise");

var methods = {};

methods.tick = function(promise, interval, name) {
  promise()
    .then(function() {
      //do nothing
    })
    .catch(function(err) {
      //log err
      console.log("ERROR IN ", name, "TICK:", err.stack);
    })
    .finally(function() {
      console.timeEnd(name);
      setTimeout(function() {
        methods.tick(promise, interval, name);
        console.time(name);
      }, interval);
    });
};

methods.formatMessage = function(items) {
  var wholeMessage = "```";
  lodash.each(items, item => {
    console.log(item);
    wholeMessage += `\n ${item.name} - $${item.price}`;
  });
  wholeMessage += "```";
  return wholeMessage;
};

methods.mapPrices = function(prices) {
  return lodash.map(prices, (price, key) => {
    return {
      price: price,
      name: key
    };
  });
};

methods.searchFilter = function(prices, searchTerm, fuzzy) {
  var ITEM_LIST = methods.mapPrices(prices);
  var searchWords = lodash(searchTerm)
    .toUpper()
    .split(/[ -,\)\(\|]+/g);
  var matches = lodash.reduce(
    ITEM_LIST,
    function(result, item) {
      var itemWords = lodash(item.name)
        .toUpper()
        .split(/[ -,\)\(\|]+/g);
      var score = 0;
      lodash.each(searchWords, function(searchword) {
        lodash.each(itemWords, function(itemword) {
          if (searchword.length <= 1) return;
          if (itemword.length <= 1) return;
          if (itemword == searchword) score += searchword.length;
          if (lodash.includes(itemword, searchword)) {
            score += searchword.length;
          }
        });
      });
      if (score > 0) {
        result.push({
          score,
          item,
          price: item.price,
          length: item.name.length
        });
      }
      return result;
    },
    []
  );
  var result = lodash(matches)
    .orderBy(["score", "length", "price"], ["desc", "asc", "desc"])
    .take(10)
    .value();
  return lodash.map(result, "item");
};

methods.listSalePrices = function(appid) {
  appid = appid || "730";

  return requestP({
    method: "get",
    uri: `https://api.pubgzone.com/listSalePrices?appid=${appid}`,
    body: {},
    json: true
  });
};

methods.parseChatParams = function(message, names) {
  assert(names, "requires parameter names");
  assert(message, "requires chat message");
  names = lodash.castArray(names);
  var words = lodash.split(message, " ").slice(1);
  //last parameter is always teh reason,optional
  var reason = words.slice(names.length);
  var params = {};
  lodash.each(names, function(name, i) {
    assert(words[i], "missing parameter [" + name + "] ");
    params[name] = words[i];
  });
  if (reason && reason.length) {
    params.reason = reason.join(" ");
  }
  return params;
};

methods.envToConfig = env => {
  return {
    socket: {
      url: env.SOCKET_URL
    },
    slack: {
      token: env.SLACK_TOKEN
    },
    discord: {
      token: env.DISCORD_TOKEN
    },
    twitter: {
      consumer_key: env.TWITTER_CONSUMER_KEY,
      consumer_secret: env.TWITTER_CONSUMER_SECRET,
      access_token_key: env.TWITTER_ACCESS_TOKEN_KEY,
      access_token_secret: env.TWITTER_ACCESS_TOKEN_SECRET
    }
  };
};

module.exports = methods;
