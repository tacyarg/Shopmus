require('dotenv').config()
const Promise = require('bluebird')
const utils = require('./lib/utils')
const Statesync = require('statesync')
const lodash = require('lodash')

const ServerSocket = require('./lib/socket')
const Discord = require('./lib/discord')
const Slack = require('./lib/slack')
const ChatCommands = require('./lib/chatCommands')

const CONFIG = utils.envToConfig(process.env)

Promise.props({
  socket: ServerSocket(CONFIG.socket),
  discord: Discord(CONFIG.discord),
  slack: Slack(CONFIG.slack)
}).then(libs => {
  console.log('App initalized!')
  // const runCommand = ChatCommands(libs)

  const SubmitOpening = function (opening) {
    // console.log(opening)
    const price = opening.item.suggested_price_floor / 100
    return libs.discord.sendMessageToChannelName('case-site', `
      A user named **${opening.user.username}** unboxed a **${opening.item.name}** worth **$${price.toFixed(2)}** from **Case #${opening.case_id}** on VGODogg.com!
    `)
  }

  libs.socket.callAction('getServerState').then(state => {
    state = Statesync(state)
    libs.socket.on('diff', state.patch)
    return state
  }).then(serverState => {
    const sendOpening = lodash.debounce(SubmitOpening, 100)
    serverState.on('recentOpenings', openings => sendOpening(openings[0]))
  })

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
