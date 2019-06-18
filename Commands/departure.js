const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");
const { editSheets, readSheets } = require("../GoogleAuth.js");

module.exports = {
    name: "departure",
    aliases: ["dep"],    
    helpDesc: "Adds flight to flights being tracked",
    helpTitle: "Departure <Callsign> <Departing> <Arrival>",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        const values = [
            [message.author.username, args[0], "Offline", args[1], "", "", args[2]],
        ];
        
        const rows = await readSheets(pie, "P3:X");

        let firstEmpty = 3;

        for(rowIndex in rows) {
            if(rows[rowIndex][0] != "" && rows[rowIndex][0] != undefined) {
                firstEmpty++;
            } else {
                break;
            }
        }
        
        // TODO: Code which puts it in the last row possible and/or checks for a not duplicate entry
        // Also - check that they are on vatsim?
        editSheets(pie, "P" + firstEmpty + ":X" + firstEmpty, values);
		  
    }
}