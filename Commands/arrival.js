const { PIEClient } = require("../index.js");
const { Message, MessageEmbed } = require("discord.js");
const { editSheets } = require("../GoogleAuth.js");

module.exports = {
    name: "arrival",
    aliases: ["arr"],    
    helpDesc: "Adds flight to flights being tracked",
    helpTitle: "Arrival",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        const values = [
			[message.createdAt.toUTCString(), "Bot works"],
		];
        
        // TODO: Code which puts it in the last row possible and/or checks for a not duplicate entry
        // Also - check that they are on vatsim?
        editSheets(pie, "V6:W6", values);
		  
    }
}