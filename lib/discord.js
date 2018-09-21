const Promise = require('bluebird')
const Discord = require("discord.js");
const assert = require('assert')

module.exports = function (config) {
  assert(config.token, 'discord token required')
  const { token } = config

  const client = new Discord.Client();
  client.login(token);

  client.sendMessageToChannelName = Promise.method(function (name, message) {
    return client.channels.find('name', name).send(message)
  })

  return Promise.fromCallback(done => {
    client.on("ready", () => {
      console.log('Discord initalized!')
      done(null, client)
    })
    client.on("error", done)
  })
};