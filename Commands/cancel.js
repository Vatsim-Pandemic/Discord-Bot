const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");

module.exports = {
    aliases: ["can"],    
    helpDesc: "Cancels current flight if it has not been completed",
    helpTitle: "Cancel",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        return message.reply("currently disabled due to bugs with editing Spreadsheet. Will be fixed tomorrow hopefully.");
      
    }
}