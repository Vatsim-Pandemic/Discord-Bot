const { Client, Collection } = require('discord.js');
const { prefix } = require('./config.json');
const { google } = require('googleapis');
const Vatsim = require('./Vatsim/Vatsim.js');
const Util = require('./util.js');
const dotenv = require('dotenv');
const googleAuth = require('./GoogleAuth.js');

dotenv.config();

class PIEClient extends Client {
	constructor() {
		super();

		this.commands = new Collection();
		this.aliases = new Collection();
		this.vatsim = Vatsim;
		this.util = Util;

		this.vatsim.init(twoMinuteTimer);

		this.once("ready", onReady);
		this.on("message", onMessage);

		this.login(process.env.TOKEN);
	}
}

const client = new PIEClient();

async function onReady() {
	client.util.loadCommands(client);

	const auth = await googleAuth.getGoogleAuth();

	client.sheets = google.sheets({version: 'v4', auth });

	console.log('Ready!');
}

function onMessage(message) {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
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

const OFFLINE = "Offline";
const BEFORETO = "Online - Before T/O";
const INFLIGHT = "Online - In Flight";
const ARRIVED = "Online - Arrived";

async function twoMinuteTimer() {
	
	await Util.sleep(8000);
	const flights = await googleAuth.readSheets(client, "P3:X");

	for(index in flights){
		const row = flights[index];            

		if((row[7] == undefined || row[7] == "") && row[0] != undefined){

			let pilot, online, status;

			try {
				pilot = client.vatsim.getPilot(row[1].toUpperCase());
				online = true;
			} catch (err) {
				online = false;
			}

			if(!online) status = OFFLINE;
			else if(!pilot.departed) status = BEFORETO;
			else if(!pilot.arrived) status = INFLIGHT
			else status = ARRIVED;

			if(online) console.log(pilot.departed);

			if(status.toLowerCase() == row[2].toLowerCase()) continue;

			if(row[2].toLowerCase() == OFFLINE.toLowerCase() && status.toLowerCase() == BEFORETO.toLowerCase() && !pilot.departed && !pilot.airportDetectionFailed) {
				row[2] = BEFORETO;
			}
			else if(row[2].toLowerCase() == BEFORETO.toLowerCase() && status.toLowerCase() == INFLIGHT.toLowerCase() && !pilot.arrived) {
				row[2] = INFLIGHT;	
				row[4] = new Date().toUTCString();
			}
			else if(row[2].toLowerCase() == INFLIGHT.toLowerCase() && status.toLowerCase() == ARRIVED.toLowerCase()) {
				row[2] = ARRIVED;
				row[7] = new Date().toUTCString();
			}
			else row[2] = OFFLINE;
		}
	}

	googleAuth.editSheets(client, "P3" + ":X", flights);

	client.emit("pilotInfoUpdate");
}

module.exports = {
	PIEClient : PIEClient,
}
