const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");

module.exports = {
    aliases: [],
    helpDesc: "Return PIE\'s response time",
    helpTitle: "Ping",

    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        var ping1 = message.createdTimestamp;
        message = await message.channel.send('Pinging...')

        let ping2 = message.createdTimestamp - ping1;

        try{
            message.edit('Pong! Message ping was ' + ping2 + ' ms. The Websocket ping was ' + pie.ws.ping.toFixed(0) + ' ms.');
        } catch(err) {
            message.edit('Pinging... That didn\'t quite work.');
            throw err;
        }    
    }
} 