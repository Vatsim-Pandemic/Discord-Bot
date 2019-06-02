const { PIEClient } = require("../index.js");
const { Message, MessageEmbed } = require("discord.js");

module.exports = {
    name: "pilot",
    aliases: [],    
    helpDesc: "Get a pilot from Vatsim",
    helpTitle: "Pilot <Callsign>",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        let embed = new MessageEmbed();
        let pilot;
        try{
            //pilot = pie.vatsim.getPilot(args[0]);
        } catch (err){
            console.error(err);
            embed.setTitle("Pilot not found!")
            .addField(":(");
        }

        if(pilot != undefined)
        embed.setTitle(`${pilot.callsign} - ${pilot.realName} (${pilot.cid})`)
            .addField("Planned Route", `${pilot.plannedDepartingAirport} - ${pilot.plannedDestinationAirport} (FL${pilot.plannedAltitude / 100})`)
            .addField("Aircraft", pilot.plannedAircraft)
            .addField("Altitude", pilot.altitude)
            .addField("Has Departed?", pilot.departed)
            .addField("Has Arrived?", pilot.arrived);


        message.channel.send({embed: embed});
    }
}