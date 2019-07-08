const { PIEClient } = require("../index.js");
const { Message } = require("discord.js");

module.exports = {
    aliases: [],    
    helpDesc: "Bot Maintenance",
    helpTitle: "Eval",
    
    /**
     * @param { PIEClient } pie PIEClient
     * @param { string[] } args string array seperated by spaces
     * @param { Message } message message
     */
    run: async (pie, args, message) => {
        if(message.author.id != "139548522377641984") return message.reply("Can only be ran by 1Revenger1");

        var evalArgs = '';
        for(var i = 0; i < args.length; i++){
            evalArgs += args[i] + " ";
        }
        
        try {
          return message.channel.send(`\`\`\`js\n${eval(evalArgs)}\n\`\`\``);
        } catch (e) {
          return message.channel.send(`\`\`\`js\n${e.stack}\n\`\`\``);
        }    
    }
}