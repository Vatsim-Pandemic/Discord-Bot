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

	this.vatsim.init(twoMinuteTimer);

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

const OFFLINE = "Offline";
const INVALIDFP = "Online - Invalid FP";
const INVALIDSTAT = "Online - Invalid Status";
const BEFORETO = "Online - Before T/O";
const INFLIGHT = "Online - In Flight";
const ARRIVED = "Arrived";

async function twoMinuteTimer() {
	console.log("----------------------");
	console.log("Two Minute Timer: " + new Date().toUTCString());
	
	const flights = await googleAuth.readSheets(client, "P3:AA");

	for(index in flights){
		const row = flights[index];            

		if((row[9] == undefined || row[9] == "") && row[0] != undefined){

			let pilot, online, status;

			try {
				pilot = client.vatsim.getPilot(row[2].toUpperCase());
				online = true;
			} catch (err) {
				online = false;
			}

			if(!online) status = OFFLINE;
			else if(!pilot.departed) status = BEFORETO;
			else if(!pilot.arrived) status = INFLIGHT
			else status = ARRIVED;

			console.log(status);

			// Invalid flight
			if(online && pilot.plannedDepartingAirport.toLowerCase() != row[4].toLowerCase()) status = INVALIDFP;
			//if(online && pilot.plannedDestinationAirport.toLowerCase() != row[7].toLowerCase()) status = INVALIDFP;

			if(status.toLowerCase() == row[3].toLowerCase()) continue;

			if((row[3].toLowerCase() == OFFLINE.toLowerCase() || row[3].toLowerCase() == INVALIDFP.toLowerCase() || row[3].toLowerCase() == INVALIDSTAT.toLowerCase()) && status.toLowerCase() == BEFORETO.toLowerCase()
				 && !pilot.departed && !pilot.airportDetectionFailed) {
				row[3] = BEFORETO;
			}
			else if(row[3].toLowerCase() == BEFORETO.toLowerCase() && status.toLowerCase() == INFLIGHT.toLowerCase() && !pilot.arrived) {
				row[3] = INFLIGHT;	
				row[5] = new Date().toUTCString();
			}
			else if(row[3].toLowerCase() == INFLIGHT.toLowerCase() && status.toLowerCase() == ARRIVED.toLowerCase() && (pilot.plannedDestinationAirport.toLowerCase() == row[7].toLowerCase() || pilot.plannedDestinationAirport.toLowerCase() == row[8].toLowerCase())) {
				row[3] = ARRIVED;
				row[9] = new Date().toUTCString();
				row[10] = await Util.getVatstatsLink(pilot.cid, row);
			}
			else if (status == INVALIDFP) row[3] = INVALIDFP;
			else if ((row[3].toLowerCase() == OFFLINE.toLowerCase() || row[3].toLowerCase() == INVALIDFP.toLowerCase() || row[3].toLowerCase() == INVALIDSTAT.toLowerCase()) && pilot.departed) {
				row[3] = INVALIDSTAT;  
				pilot.resetDepartStatus();
			}
			else row[3] = OFFLINE;
		}
	}

	googleAuth.editSheets(client, "P3" + ":AA", flights);

	client.emit("pilotInfoUpdate");
}

module.exports = {
	PIEClient : PIEClient,
}
