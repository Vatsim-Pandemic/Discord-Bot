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
        const flights = await readSheets(pie, "P3:AA");

        let newMessage = "Current Flights:\n";

        for(index in flights){
            const row = flights[index];            

            let lastAirport = row[8] != undefined && row[8] != "" ? row[8] : row[7];

            if(row[0] != undefined){
                newMessage += `**${row[2]}**: ${row[4]} - ${lastAirport} Flown by: *${row[0]}* Status: *${row[3]}*\n`
            }
        }
        
        message.channel.send(newMessage);
    }
}