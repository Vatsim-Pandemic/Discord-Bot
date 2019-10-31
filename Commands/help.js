const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");

module.exports = {
    aliases: [],    
    helpDesc: "Lists commands",
    helpTitle: "Help",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
		var helpString = "***__PIE Commands__***\nUse " + process.env.PREFIX + " or <@" + pie.user + "> to trigger commands\n\n"		

		var generalString = "**__General__**\n";

		pie.commands.forEach((value, key, map) => {
			if(!value.ignore)
				generalString += "*" + value.helpTitle + "*: " + value.helpDesc + "\n";
		});

		helpString += generalString;

		message.channel.send(helpString);
	}
}