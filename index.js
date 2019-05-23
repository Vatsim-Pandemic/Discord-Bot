const { Client, Collection } = require('discord.js');
const Vatsim = require('./Vatsim/Vatsim.js');
const Util = require('./util.js');
const dotenv = require('dotenv');

dotenv.config();

const prefix = process.env.PREFIX;

class PIEClient extends Client {
	constructor() {
		super();

		this.commands = new Collection();
		this.aliases = new Collection();
		this.vatsim = Vatsim;
		this.util = Util;

		this.once("ready", onReady);
		this.on("message", onMessage);

		this.login(process.env.TOKEN);
	}
}

const client = new PIEClient();

module.exports = {
	PIEClient : PIEClient,
}

function onReady() {
	client.util.loadCommands(client);

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
		if(client.aliases.has(commandName)) commandName = client.aliases.get(commandName);
		
		// Fail silently if the command given is not in the map
		if(!client.commands.has(commandName)) return;

		const command = client.commands.get(commandName);

		if(!command.run) return message.channel.send("Command contains no run method");

		command.run(client, args, message);
	}
}
