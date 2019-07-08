const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");
const { editSheets, readSheets } = require("../GoogleAuth.js");
const { hasPilotArrived, hasPilotGaveLink } = require("../util.js");

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
        // Check we have all the arguments.
        if(args.length != 3) return message.reply(" incorrect usage. Example: `!dep IHS1503 EGLL KJFK`");

        const rows = await readSheets(pie, "P3:AA");

        let pilot;

        // Get the last flight for the pilot
        for(pilotIndex in rows) {
            const row = rows[pilotIndex];

            if(row[1] == message.author.id) {
                pilot = row;
            }
        }

        // If the pilot has done a flight, make sure previous flight is finished
        if(pilot != undefined) {
            if(!hasPilotArrived(pilot)) return message.reply("please land and use the !arr command before trying to start another flight; additionally, you can use !cancel");
            if(!hasPilotGaveLink(pilot)) return message.reply("please use the !arr command to supply vatstats links before using this command");

            // alternates
            let lastAirport = pilot[8] != undefined && pilot[8] != "" ? pilot[8] : pilot[7];

            // Check that the pilot is starting from the last airport landed at
            if(lastAirport.toUpperCase() != args[1].toUpperCase()) return message.reply("the last airport you landed at was `" + lastAirport + "`. Please depart from the airport you last landed at");
        }

        // Values which go into the spreadsheet
        const values = [
            [message.member.nickname, message.member.id, args[0], "Offline", args[1], "", "", args[2]],
        ];

        let firstEmpty = 3;

        // Find first empty row
        for(rowIndex in rows) {
            if(rows[rowIndex][0] != "" && rows[rowIndex][0] != undefined) {
                firstEmpty++;
            } else {
                break;
            }
        }
        
        // TODO: Code which puts it in the last row possible and/or checks for a not duplicate entry
        // Also - check that they are on vatsim?
        editSheets(pie, "P" + firstEmpty + ":AA" + firstEmpty, values);
        message.reply("now tracking Flight " + args[0] + " from " + args[1] + " to " + args[2]);
        pie.channels.get("507568591667855390").send(`Tracking flight ${args[0]} from ${args[1]} to ${args[2]} by ${message.member.toString()}`);
    }
}