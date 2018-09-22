const Socket = require('socket.io-client');
const Promise = require('bluebird')
const assert = require('assert')

module.exports = function (config) {
  assert(config, 'requires socket config')
  const { url } = config

  var isStarted = false;
  const socket = Socket(url)

  socket.callAction = function (action, params) {
    return Promise.fromCallback(done => {
      socket.emit('action', action, params, done)
    })
  }

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