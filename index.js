const { Client, Collection } = require('discord.js');
const Util = require('./util.js');
const dotenv = require('dotenv');
const request = require('request');

dotenv.config();

class PIEClient extends Client {
	constructor() {
		super();

		this.commands = new Collection();
		this.aliases = new Collection();
		this.util = Util;

		this.once("ready", onReady);
		this.on("message", onMessage);
		this.login(process.env.TOKEN);
	}
}

const client = new PIEClient();

async function onReady() {
	client.util.loadCommands(client);
	console.log('Ready!');
}

function onMessage(message) {
	if ((!message.content.startsWith(process.env.PREFIX) && !message.content.startsWith(client.user)) || message.author.bot) return;

	const args = message.content.slice(process.env.PREFIX.length).split(/ +/);

	// Shift arguments if bot is triggered by a mention rather than with the prefix
	if(message.content.startsWith(client.user)) args.shift();

	let commandName = args.shift().toLowerCase();

	// Replace the commandName with the full commandName
	if(client.aliases.has(commandName)) commandName = client.aliases.get(commandName);
	
	// Fail silently if the command given is not in the map
	if(!client.commands.has(commandName)) return;

	const command = client.commands.get(commandName);

	if(!command.run) return message.channel.send("Command contains no run method");

	try {
		command.run(client, args, message);
	} catch (err) {
		// TODO: Tell user that an error occured maybe?
		console.err(err);
	}
}

module.exports = {
	PIEClient : PIEClient,
}
