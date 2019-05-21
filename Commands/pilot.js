const Discord = require("discord.js");

module.exports = {
    name: "pilot",
    aliases: [],    
    helpDesc: "Get a pilot from Vatsim",
    helpTitle: "Pilot <Callsign>",
    run: async (bot, message, args) => {
        let embed = new Discord.MessageEmbed();
        let pilot;
        try{
            pilot = bot.Vatsim.getPilot(args[1]);
        } catch (err){
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