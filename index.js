require("dotenv").config();
const Promise = require("bluebird");
const utils = require("./lib/utils");
const Statesync = require("statesync");
const lodash = require("lodash");

const ServerSocket = require("./lib/socket");
const Discord = require("./lib/discord");
const Slack = require("./lib/slack");
const ChatCommands = require("./lib/chatCommands");

const CONFIG = utils.envToConfig(process.env);

Promise.props({
  socket: ServerSocket(CONFIG.socket),
  discord: Discord(CONFIG.discord),
  slack: Slack(CONFIG.slack)
}).then(libs => {
  console.log("App initalized!");
  // const runCommand = ChatCommands(libs)

  const SubmitOpening = function(opening) {
    const price = opening.item.suggested_price_floor / 100;

    console.log(opening.id, opening.item.name, price);

    // if (price < 10) return;
    return libs.discord.sendMessageToChannelName("case-site", {
      embed: {
        // color: opening.item.color,
        author: {
          name: opening.user.username,
          icon_url: opening.user.avatarurl
        },
        title: "VGODogg.com Case Opening",
        url: "http://vgodogg.com",
        description: `A **${
          opening.item.category
        }** has just been unboxed from **case #${opening.case_id}** on vgodogg.com!`,
        fields: [
          {
            name: "Name",
            value: opening.item.name
          },
          {
            name: "Value",
            value: `$${price.toFixed(2)}`
          },
          {
            name: "Wear",
            value: `${opening.item.wear}`
          }
        ],
        // thumbnail: {
        //   url: opening.item.image["300px"]
        // },
        image: {
          url: opening.item.preview_urls
            ? opening.item.preview_urls.front_image
            : opening.item.image["300px"],
          height: 100
        }
      }
    });
  };

  libs.socket
    .callAction("getServerState")
    .then(state => {
      state = Statesync(state);
      libs.socket.on("diff", state.patch);
      return state;
    })
    .then(serverState => {
      const sendOpening = lodash.debounce(SubmitOpening, 100);
      serverState.on("recentOpenings", openings => {
        var box = openings[0];
        sendOpening(box);
      });

      // SubmitOpening(fakeOpening);
    });

  // replicate chat messages to discord/slack
  // libs.state.on(['chats', 'en'], function (state, value, key) {
  //   var chat = value.chat[0];
  //   return Promise.all([
  //     libs.discord.sendMessageToChannelName('site-chat', `**${chat.user.username}:** ${chat.message}`),
  //     libs.slack.sendMessageToChannelName('site-chat', `*${chat.user.username}:* ${chat.message}`)
  //   ])
  // })

  // listen for !cmds
  libs.slack.on("newCommand", message => {
    return runCommand(message.text)
      .then(formattedMessage => {
        return libs.slack.sendMessage(formattedMessage, message.channel);
      })
      .catch(err => console.error(err.message));
  });
});

const fakeOpening = {
  case_id: 2,
  case_site_trade_offer_id: 1501960,
  created: 1532473746197,
  done: true,
  id: 725070,
  item: {
    category: "Mil-Spec SMG",
    color: "#4b69ff",
    eth_inspect: null,
    id: 2123338,
    image: {
      "300px":
        "https://files.opskins.media/file/vgo-img/item/mp9-red-camo-battle-scarred-300.png",
      "600px":
        "https://files.opskins.media/file/vgo-img/item/mp9-red-camo-battle-scarred-600.png"
    },
    inspect: null,
    internal_app_id: 1,
    name: "MP9 | Red Camo (Battle-Scarred)",
    paint_index: null,
    pattern_index: 450,
    preview_urls: {
      back_image:
        "https://files.opskins.media/file/vgo-img/previews/1702325_back.jpg",
      front_image:
        "https://files.opskins.media/file/vgo-img/previews/1702325_front.jpg",
      thumb_image:
        "https://files.opskins.media/file/vgo-img/previews/1702282_thumb.jpg",
      video:
        "https://files.opskins.media/file/vgo-img/previews/1702325_video.webm"
    },
    rarity: "Mil-Spec",
    sku: 130,
    suggested_price: 2,
    suggested_price_floor: 2,
    trade_hold_expires: null,
    type: "SMG",
    wear: 0.62602359056473
  },
  status: 3,
  status_text: "Opened",
  updated: 1532473746197,
  user: {
    avatarurl:
      "https://steamcdn-a.opskins.media/steamcommunity/public/images/avatars/57/573f45615e0fe0e8dcbcd835538fa404994f5529.jpg",
    id: "f7c60cf1-ff27-4938-8b83-620a2e6a8c5a",
    steamid: "76561198403312375",
    username: "tacyarg"
  },
  userid: "f7c60cf1-ff27-4938-8b83-620a2e6a8c5a"
};
