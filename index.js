const { Client, Collection } = require('discord.js');
const { prefix } = require('./config.json');
const Util = require('./util.js');
require('dotenv').config();
const parse = require('./parse');

const FLIGHT_TABLE_ID = "596409775290450081";

class PIEClient extends Client {
	constructor() {
		super();

		this.commands = new Collection();
		this.aliases = new Collection();
		this.util = Util;
		this.parse = parse;

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
	if ((!message.content.startsWith(prefix) && !message.content.startsWith(client.user)) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);

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

async function twoMinuteTimer() {
	
	
}

module.exports = {
	PIEClient : PIEClient,
}
