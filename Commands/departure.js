const { PIEClient } = require("../index.js");
const { Message, MessageEmbed } = require("discord.js");
const { editSheets } = require("../GoogleAuth.js");

module.exports = {
    name: "departure",
    aliases: ["dep"],    
    helpDesc: "Adds flight to flights being tracked",
    helpTitle: "Departure <Callsign> <Departing> <Arrival>",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        const values = [
			[message.author.username, args[0], args[1], message.createdAt.toUTCString(), null, args[2]],
		];
        
        // TODO: Code which puts it in the last row possible and/or checks for a not duplicate entry
        // Also - check that they are on vatsim?
        editSheets(pie, "P6:U6", values);
		  
    }
}