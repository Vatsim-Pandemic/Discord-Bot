const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");
const { readSheets } = require("../GoogleAuth.js");

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
        const flights = await readSheets(pie, "P3:W");

        let newMessage = "Current Flights:\n";

        for(index in flights){
            const row = flights[index];            

            if(row[0] != undefined){
                newMessage += `**${row[2]}**: ${row[4]} - ${row[7]} Flown by: *${row[0]}* Status: *${row[3]}*\n`
            }
        }
        
        message.channel.send(newMessage);
    }
}