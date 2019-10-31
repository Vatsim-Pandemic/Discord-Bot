const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");

module.exports = {
    aliases: [],    
    helpDesc: "Lists flights which have not arrived yet",
    helpTitle: "Flights",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        return message.reply("this is not implemented yet");
    }
}