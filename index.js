const Discord = require('discord.js');
const { prefix, token, sheetID, departureCells } = require('./config.json');
const creds = require('./client-secret.json');
const fs = require('fs');
// const GoogleSpreadsheet = require('google-spreadsheet');
let sheet = '';

// const doc = new GoogleSpreadsheet(sheetID);

// doc.useServiceAccountAuth(creds, (err) => {
// 	if (err) {
// 		throw err;
// 	}
// 	console.log('Auth Sucessful');
// });

// doc.getInfo(function(err, info) {
//	sheet = info.worksheets[0];
// });

class PIEClient {
	constructor() {
		this.client = new Discord.Client();
		this.commands = new Discord.Collection();
		this.aliases = new Discord.Collection();
		this.vatsim = require(`./Vatsim/Vatsim.js`);

		this.client.once("ready", onReady);
		this.client.on("message", onMessage);

		this.client.login(token);
	}
}

function onReady() {
	loadCommands();

	console.log('Ready!');
}

function onMessage(message) {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	let commandName = args.shift().toLowerCase();

	if (commandName === 'dep') {
		const depData = [message.author.username, args[0], args[1], message.createdAt.toUTCString(), args[2]];

		// sheet.getCells({
		// 	'min-row': startingRow,
		// 	'min-col': 16,
		// 	'max-col': 23,
		// }, (err, cells) => {
		// 	if(err) throw err;

		// 	for (let i = 0; i < 5; i++) {
		// 		const cell = cells[departureCells[i]];
		// 		cell.value = depData[i];
		// 		cell.save();
		// 	}
		// 	message.channel.send('you have been dispached.');
		// 	startingRow++;
		// });
	}
	else if(commandName === 'arr') {
		const arrData = [message.author, args[3], message.createdAt.toUTCString()];


	}
	else {
		// Replace the commandName with the full commandName
		if(aliases.has(commandName)) commandName = aliases.get(commandName);
		
		// Fail silently if the command given is not in the map
		if(!commands.has(commandName)) return;

		const command = commands.get(commandName);

		if(!command.run) return message.channel.send("Command contains no run method");

		command.run(client, args, message);
	}
}
