const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");
const { editSheets, readSheets } = require("../GoogleAuth.js");
const { hasPilotArrived, hasPilotGaveLink } = require("../util.js");

module.exports = {
    aliases: ["can"],    
    helpDesc: "Cancels current flight if it has not been completed",
    helpTitle: "Cancel",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        let pilotList = await readSheets (pie, "P3:AA");
        
        let pilot;
        let pilotIndex = 0;

        // Get the last flight for the pilot
        for(pilotI in pilotList) {
            const row = pilotList[pilotI];

            if(row[1] == message.author.id) {
                pilot = row;
                pilotIndex = pilotI;
            }
        }

        if(pilot == undefined) return message.reply("no flight to cancel.");

        if((pilot[9] != undefined && pilot[9] != "") || hasPilotArrived(pilot)) return message.reply("last flight completed, cannot cancel.");

        // Shift everything up by one on the spreadsheet
        for(let i = pilotIndex; i < pilotList.length - 1; i++) {
            pilotList[i] = pilotList[i+1];
        }

        // Empty out the last row
        pilotList[pilotIndex + 1] = ["","","","","","","","","","","",""];

        editSheets(pie, "P3:AA", pilotList);

        //Tell user that we did put in the vatstats link into the spreadsheet.
        message.reply("Canceled flight");

    }
}