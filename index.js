const { Client, Collection } = require('discord.js');
const { prefix, token, spreadsheetId, range, valueInputOption } = require('./config.json');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
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

const gClient = new JWT(
	creds.client_email,
	null,
	creds.private_key,
	['https://www.googleapis.com/auth/spreadsheets'],
);

const auth = gClient.authorize(function(err) {
	if(err) throw err;
	else console.log('Sucess');
});

let sheets = google.sheets({ version: 'v4', auth });

function onReady() {
	client.util.loadCommands(client);

	console.log('Ready!');
}

function onMessage(message) {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	let commandName = args.shift().toLowerCase();

	if (command === 'dep') {
		const values = [
			[message.author.username, args[0], args[1], message.createdAt.toUTCString(), null, args[2]],
		  ];

		  const resource = {
			values,
		  };
		  sheets.spreadsheets.values.update({
			spreadsheetId,
			range,
			valueInputOption,
			resource,
		  }, (err, result) => {
			if (err) {
			  // Handle error
			  console.log(err);
			} else {
			  console.log('%d cells updated.', result.updatedCells);
			}
		  });
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
