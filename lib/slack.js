var lodash = require('lodash')
var Promise = require('bluebird')
const assert = require('assert')

const {
  WebClient,
  RtmClient,
  CLIENT_EVENTS,
  RTM_EVENTS
} = require('@slack/client');

// initialization
module.exports = function (config) {
  assert(config.token, 'slack token required')
  const { token } = config

  const web = new WebClient(token);
  const appData = {};

  // Initialize the RTM client with the recommended settings. Using the defaults for these
  // settings is deprecated.
  const rtm = new RtmClient(token, {
    dataStore: false,
    useRtmConnect: true,
  });

  // The client will emit an RTM.AUTHENTICATED event on when the connection data is available
  // (before the connection is open)
  rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
    // Cache the data necessary for this app in memory
    appData.selfId = connectData.self.id;
    // console.log(`Logged in as ${appData.selfId} of team ${connectData.team.id}`);
  });

  rtm.start(); // Start the connecting process
  return Promise.fromCallback(done => {
    // The client will emit an RTM.RTM_CONNECTION_OPENED the connection is ready for
    // sending and receiving messages
    return rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => done(null, rtm));
  }).then(rtm => {

    rtm.findChannel = function (name) {
      return web.channels.list().then(resp => {
        return lodash.find(resp.channels, row => {
          return row.name == name;
        })
      })
    }

    rtm.sendMessageToChannelName = function (name, message) {
      return rtm.findChannel(name).then(channel => {
        return rtm.sendMessage(message, channel.id)
      })
    }

    // emit all messages that are not from the bot.
    rtm.on(RTM_EVENTS.MESSAGE, (message) => {
      if (!message.text) return;

      // Skip messages that are from a bot or my own user ID
      if ((message.subtype && message.subtype === 'bot_message') ||
        (!message.subtype && message.user === appData.selfId)) {
        return;
      }

      if (message.text.charAt(0) == "!") {
        rtm.emit('newCommand', message);
      }
    });

    console.log('Slack initalized!')
    return rtm;
  })
};