require("dotenv").config();
const Promise = require("bluebird");
const utils = require("./lib/utils");
const Statesync = require("statesync");
const lodash = require("lodash");

const ServerSocket = require("./lib/socket");
const Discord = require("./lib/discord");
const Slack = require("./lib/slack");
const Twitter = require("./lib/twitter");
const ChatCommands = require("./lib/chatCommands");

const CONFIG = utils.envToConfig(process.env);

Promise.props({
  twitter: Twitter(CONFIG.twitter),
  discord: Discord(CONFIG.discord)
  // socket: ServerSocket(CONFIG.socket),
  // slack: Slack(CONFIG.slack)
}).then(libs => {
  console.log("App initalized!");
  // const runCommand = ChatCommands(libs)

  const FOLLOW_ACCOUNTS = [
    "988574835449171970",
    "897652496461680640",
    "2920047010"
  ];
  const TRACK_TERMS = ["vgo_gg", "wax_io", "opskinsgo"];

  const stream = libs.twitter.stream("statuses/filter", {
    follow: FOLLOW_ACCOUNTS.toString()
  });
  stream.on("data", function(event) {
    console.log(event);
    SubmitTwitterEvent(event);
  });

  const SubmitTwitterEvent = event => {
    var { id_str, user, text, in_reply_to_screen_name } = event;

    if (!FOLLOW_ACCOUNTS.includes(user.id_str)) return;

    return libs.discord.sendMessageToChannelName("twitter-feed", {
      embed: {
        author: {
          name: user.screen_name,
          icon_url: user.profile_image_url_https
        },
        title: "Tweet",
        url: `https://twitter.com/${user.screen_name}/status/${id_str}`,
        description: text
        // fields: [
        //   {
        //     name: "Name",
        //     value: opening.item.name
        //   },
        //   {
        //     name: "Value",
        //     value: `$${price.toFixed(2)}`
        //   },
        //   {
        //     name: "Wear",
        //     value: `${opening.item.wear}`
        //   }
        // ],
        // image: {
        //   url: opening.item.preview_urls
        //     ? opening.item.preview_urls.front_image
        //     : opening.item.image["300px"],
        //   height: 100
        // }
      }
    });
  };

  // const SubmitOpening = function(opening) {
  //   const price = opening.item.suggested_price_floor / 100;

  //   console.log(opening.id, opening.item.name, price);

  //   if (price < 5) return;
  //   return libs.discord.sendMessageToChannelName("case-site", {
  //     embed: {
  //       author: {
  //         name: opening.user.username,
  //         icon_url: opening.user.avatarurl
  //       },
  //       title: "VGODogg.com Case Opening",
  //       url: "http://vgodogg.com",
  //       description: `A **${
  //         opening.item.category
  //       }** has just been unboxed from **case #${
  //         opening.case_id
  //       }** on vgodogg.com!`,
  //       fields: [
  //         {
  //           name: "Name",
  //           value: opening.item.name
  //         },
  //         {
  //           name: "Value",
  //           value: `$${price.toFixed(2)}`
  //         },
  //         {
  //           name: "Wear",
  //           value: `${opening.item.wear}`
  //         }
  //       ],
  //       image: {
  //         url: opening.item.preview_urls
  //           ? opening.item.preview_urls.front_image
  //           : opening.item.image["300px"],
  //         height: 100
  //       }
  //     }
  //   });
  // };

  // libs.socket
  //   .callAction("getServerState")
  //   .then(state => {
  //     state = Statesync(state);
  //     libs.socket.on("diff", state.patch);
  //     return state;
  //   })
  //   .then(serverState => {
  //     const sendOpening = lodash.debounce(SubmitOpening, 100);
  //     serverState.on("recentOpenings", openings => {
  //       var box = openings[0];
  //       sendOpening(box);
  //     });

  //     // SubmitOpening(fakeOpening);
  //   });

  // replicate chat messages to discord/slack
  // libs.state.on(['chats', 'en'], function (state, value, key) {
  //   var chat = value.chat[0];
  //   return Promise.all([
  //     libs.discord.sendMessageToChannelName('site-chat', `**${chat.user.username}:** ${chat.message}`),
  //     libs.slack.sendMessageToChannelName('site-chat', `*${chat.user.username}:* ${chat.message}`)
  //   ])
  // })

  // listen for !cmds
  // libs.slack.on("newCommand", message => {
  //   return runCommand(message.text)
  //     .then(formattedMessage => {
  //       return libs.slack.sendMessage(formattedMessage, message.channel);
  //     })
  //     .catch(err => console.error(err.message));
  // });
});
