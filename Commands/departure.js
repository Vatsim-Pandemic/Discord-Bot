const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");

module.exports = {
    aliases: ["dep"],    
    helpDesc: "Adds flight to flights being tracked",
    helpTitle: "Departure <Callsign> <Departing> <Arrival>",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        return message.reply("TODO");    
    }
}