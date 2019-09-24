const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");
const { editSheets, readSheets } = require("../GoogleAuth.js");
const { hasPilotArrived, hasPilotGaveLink } = require("../util.js");

const acknowledgeMessage = " You are free to start another flight using the !dep command";

module.exports = {
    aliases: ["arr"],    
    helpDesc: "Adds Vatstats link to last flight flown by user",
    helpTitle: "Arrival",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        const pilotList = await readSheets (pie, "P3:AA");
        
        let pilot;

        // Get the last flight for the pilot
        for(pilotIndex in pilotList) {
            const row = pilotList[pilotIndex];

            if(row[1] == message.author.id) {
                pilot = row;
            }
        }

        if(pilot == undefined) return message.reply("you have not flown yet. Please start a flight using the !dep command");
        if(!hasPilotArrived(pilot)) return message.reply("please land before giving the vatstats link");

        if(!args[0] || !(/(vatstats\.net\/flights\/\d+)(\d$)/gi.test(args[0]))) return message.reply("please provide a valid vatstats link");

        // See if there was already an old link in there
        let update = false;
        if(pilot[10] != undefined && pilot[10] != "") update = true;

        // Update array with the vatstats link
        pilot[10] = args[0];

        editSheets(pie, "P3:AA", pilotList);

        //Tell user that we did put in the vatstats link into the spreadsheet.
        if(update) message.reply("updating vatstats link." + acknowledgeMessage);
        else message.reply("adding vatstats link." + acknowledgeMessage);

    }
}