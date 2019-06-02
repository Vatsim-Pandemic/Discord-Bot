const { PIEClient } = require("../index.js");
const { Message, MessageEmbed } = require("discord.js");
const { readSheets } = require("../GoogleAuth.js");

module.exports = {
    name: "flights",
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

        for(index in flights.data.values){
            const row = flights.data.values[index];            

            if((row[6] == undefined || row[6] == "") && row[0] != undefined){
                newMessage += `**${row[1]}**: ${row[2]} - ${row[5]} Flown by: *${row[0]}*\n`
            }
        }
        
        message.channel.send(newMessage);
    }
}