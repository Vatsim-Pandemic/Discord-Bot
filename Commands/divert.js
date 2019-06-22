const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");
const { editSheets, readSheets } = require("../GoogleAuth.js");
const { hasPilotArrived, hasPilotGaveLink } = require("../util.js");

module.exports = {
    aliases: [],    
    helpDesc: "Divert current flight",
    helpTitle: "Divert <Alternate Airport>",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        // Check we have all the arguments.
        if(args.length != 1) return message.reply("incorrect usage. Example: `!divert KIAD`");

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
            if(hasPilotArrived(pilot)) return message.reply("you have already landed. If there is an issue, please talk to Dispatch");
        } else {
            return message.reply("please use the !dep command to start a flight");
        }

        pilot[8] = args[0].toUpperCase();
        
        // TODO: Code which puts it in the last row possible and/or checks for a not duplicate entry
        // Also - check that they are on vatsim?
        editSheets(pie, "P3:AA", rows);
		message.reply("diverting current flight to " + row[1]);
    }
}