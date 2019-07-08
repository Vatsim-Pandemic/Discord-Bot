const { Client, Collection } = require('discord.js');
const { prefix, departureChanID } = require('./config.json');
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
const COPILOT = "Copilot";
const JUMPSEAT = "Jumpseat";
const AIRPORT_NOT_RECOGNIZED = "Airport not recognized - Please talk to Dispatch";
const NO_FLIGHT_PLAN = "No Vatsim Flightplan - Please File";

async function twoMinuteTimer() {
	let flightTableString = `**__Flight Table__** - Last Updated: ${new Date().toUTCString()}\n`;
	let arrivedTableString = "--------------------------------------\n**__Arrived flights - Past 24 Hours__**\n";
	console.log("----------------------");
	console.log("Two Minute Timer: " + new Date().toUTCString());
	
	const flights = await googleAuth.readSheets(client, "P3:AA");

	for(index in flights){
		const row = flights[index];            

		if((row[9] == undefined || row[9] == "") && row[0] != undefined){

			let pilot, online, status;

			try {
				pilot = client.vatsim.getPilot(row[2].toLowerCase());
				online = true;
			} catch (err) {
				online = false;
			}

			if(!online) status = OFFLINE;
			else if(!pilot.departed) status = BEFORETO;
			else if(!pilot.arrived) status = INFLIGHT
			else status = ARRIVED;

			if(online)
				console.log("%s: Online=%s : AirportDetectionFailed=%s : Status=%s : SpreadsheetStatus=%s\n\tVatsim Route=%s-%s : Spreadsheet Route=%s-%s\n\tDeparted=%s : Arrived=%s",
					row[2].toUpperCase(), online, pilot.airportDetectionFailed, status, row[3],
					pilot.plannedDepartingAirport, pilot.plannedDestinationAirport, row[4].toUpperCase(), row[7].toUpperCase(),
					pilot.departed, pilot.arrived);
			else
				console.log("%s: Online=%s : Status=%s : SpreadsheetStatus=%s\n\tSpreadsheet Route=%s-%s",
					row[2].toUpperCase(), online, status, row[3].toLowerCase(),
					row[4].toUpperCase(), row[7].toUpperCase());
			//if(pilot.airportDetectionFailed) client.channels.get(departureChanID).send("<@" + row[1] + ">, Invalid airport from Vatsim detected! Airports: `" + pilot.plannedDepartingAirport + " " + pilot.plannedDestinationAirport + "`. Please contact Dispatchers");

			// Invalid flight
			if(online && pilot.plannedDepartingAirport.toLowerCase() != row[4].toLowerCase() && !pilot.departed) status = INVALIDFP;
			//if(online && pilot.plannedDestinationAirport.toLowerCase() != row[7].toLowerCase()) status = INVALIDFP;
			
			if(row[8] && row[8] != "")
				flightTableString += `**${row[2]}**: ${row[4]} - ${row[7]} | Diverting to ${row[8]}\nFlown by: *${row[0]}* - Status: ${row[3]}\n`;
			else
				flightTableString += `**${row[2]}**: ${row[4]} - ${row[7]}\nFlown by: *${row[0]}* - Status: ${row[3]}\n`;

			if(pilot.airportDetectionFailed && pilot.plannedDepartingAirport == "" && pilot.plannedDestinationAirport == "") status = NO_FLIGHT_PLAN;
			else if(pilot.airportDetectionFailed) status = AIRPORT_NOT_RECOGNIZED;

			if(status.toLowerCase() == row[3].toLowerCase()) continue;
			if(row[3].toLowerCase() == JUMPSEAT.toLowerCase() || row[3].toLowerCase() == COPILOT.toLowerCase()) continue;

			if(status.toLowerCase() == NO_FLIGHT_PLAN.toLowerCase()) row[3] = NO_FLIGHT_PLAN;
			if(status.toLowerCase() == AIRPORT_NOT_RECOGNIZED.toLowerCase()) row[3] = AIRPORT_NOT_RECOGNIZED;

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
				if(row[8] && row[8] != "") 
					client.channels.get("507568619987927040").send(`<@${row[1]}> has finished their flight from ${row[4]} to ${row[8]}`);
				else 
					client.channels.get("507568619987927040").send(`<@${row[1]}> has finished their flight from ${row[4]} to ${row[7]}`);
			}
			else if (status == INVALIDFP) row[3] = INVALIDFP;
			else if ((row[3].toLowerCase() == OFFLINE.toLowerCase() || row[3].toLowerCase() == INVALIDFP.toLowerCase() || row[3].toLowerCase() == INVALIDSTAT.toLowerCase()) && pilot.departed) {
				console.log(`Pilot Reset from Two minute Timer: ${row[1]}`)
				row[3] = INVALIDSTAT;  
				pilot.resetDepartStatus();
			}
			else row[3] = OFFLINE;
		} else {
			//Check the time that they arrived. If less than 8 hours, add it to the arrived string
			if(Date.now() - Date.parse(row[9]) < 86400000) {
				if(row[8] && row[8] != "")
					arrivedTableString += `**${row[2]}**: ${row[4]} - ${row[7]} | Diverted to ${row[8]}\nFlown by: *${row[0]}*\n`;
				else 
					arrivedTableString += `**${row[2]}**: ${row[4]} - ${row[7]}\nFlown by: *${row[0]}*\n`;
			}
		}
	}

	//596427894050390036 - Message id for flight table
	client.channels.get("596409775290450081").messages.fetch("596427894050390036").then(message => message.edit(flightTableString + arrivedTableString));

	googleAuth.editSheets(client, "P3" + ":AA", flights);

	client.emit("pilotInfoUpdate");
}

module.exports = {
	PIEClient : PIEClient,
}
