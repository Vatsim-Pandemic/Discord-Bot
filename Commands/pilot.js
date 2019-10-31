const { PIEClient } = require("../index.js");
const { Message, MessageEmbed } = require("discord.js");

module.exports = {
    aliases: [],    
    helpDesc: "Get a pilot from Vatsim",
    helpTitle: "Pilot <Callsign>",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        return message.reply("this is not implemented");
    }
}