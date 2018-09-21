var Promise = require('bluebird')
const utils = require('./lib/utils')

// var ChipsSocket = require('./lib/socket')
const Discord = require('./lib/discord')
const Slack = require('./lib/slack')
const ChatCommands = require('./lib/chatCommands')

const CONFIG = utils.envToConfig(process.env)

Promise.props({
  // socket: ChipsSocket(),
  discord: Discord(CONFIG.discord),
  slack: Slack(CONFIG.slack)
}).then(libs => {
  return libs.socket.getAppState().then(state => {
    libs.state = state
    return libs
  })
}).then(libs => {
  console.log('App initalized!')

  const runCommand = ChatCommands(libs)

  // replicate chat messages to discord/slack
  // libs.state.on(['chats', 'en'], function (state, value, key) {
  //   var chat = value.chat[0];
  //   return Promise.all([
  //     libs.discord.sendMessageToChannelName('site-chat', `**${chat.user.username}:** ${chat.message}`),
  //     libs.slack.sendMessageToChannelName('site-chat', `*${chat.user.username}:* ${chat.message}`)
  //   ])
  // })

  // listen for !cmds
  libs.slack.on('newCommand', message => {
    return runCommand(message.text).then(formattedMessage => {
      return libs.slack.sendMessage(formattedMessage, message.channel)
    }).catch(err => console.error(err.message))
  })

})
