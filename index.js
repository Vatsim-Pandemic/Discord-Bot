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
		//command.run(client, args, message);
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

	let changedData = false;

	for(index in flights){

		const row = flights[index];            

		try{ 
		
		if(row[0] != undefined && !Util.hasPilotArrived(row)){

			let pilot, online, status;
			const spreadState = row[3];

			try {
				pilot = client.vatsim.getPilot(row[2].toLowerCase());
				online = true;
			} catch (err) {
				online = false;
			}

			if(!online) {
				console.log("%s: Online=%s : Status=%s : SpreadsheetStatus=%s\n\tSpreadsheet Route=%s-%s",
					row[2].toUpperCase(), online, status, spreadState,
					row[4].toUpperCase(), row[7].toUpperCase());

				status = OFFLINE;
			} else {
				console.log("%s: Online=%s : AirportDetectionFailed=%s : Status=%s : SpreadsheetStatus=%s\n\tVatsim Route=%s-%s : Spreadsheet Route=%s-%s\n\tDeparted=%s : Arrived=%s",
				row[2].toUpperCase(), online, pilot.airportDetectionFailed, status, spreadState,
				pilot.plannedDepartingAirport, pilot.plannedDestinationAirport, row[4].toUpperCase(), row[7].toUpperCase(),
				pilot.departed, pilot.arrived);
				
				// We don't care about these pilots - still record them though
				// TODO: Actually put in this feature
				if(Util.statusEqual(spreadState, JUMPSEAT) || Util.statusEqual(spreadState, COPILOT)) continue; 

				// Check for a flight plan
				if(pilot.airportDetectionFailed && pilot.plannedDepartingAirport == "" && pilot.plannedDestinationAirport == "") {
					status = NO_FLIGHT_PLAN;
				
				// If departing airport do not match, then this likely isn't the flight we are looking for
				} else if (!Util.statusEqual(pilot.plannedDepartingAirport, row[4]) && !pilot.departed) { 
					status = INVALIDFP;
				
				// Check if we have the two airports wanted
				} else if (pilot.airportDetectionFailed) {
					status = AIRPORT_NOT_RECOGNIZED;

				// Error checking done - Now to check current state of flight
				} else if (Util.orStatusEqual(spreadState, OFFLINE, INVALIDFP, INVALIDSTAT, NO_FLIGHT_PLAN, AIRPORT_NOT_RECOGNIZED, BEFORETO) && !pilot.departed) {
					status = BEFORETO;

				// Only go to Inflight if they were seen on the ground
				} else if (Util.orStatusEqual(spreadState, BEFORETO, INFLIGHT) && !pilot.arrived) {
					status = INFLIGHT;
					row[5] = new Date().toUTCString();

				// Only go into Arrived if they were in flight AND their arrival airports match in Vatsim & Spreadsheet
				} else if (Util.statusEqual(spreadState, INFLIGHT) && (Util.statusEqual(pilot.plannedDestinationAirport, row[7]) || Util.statusEqual(pilot.plannedDestinationAirport, row[8]))) {
					status = ARRIVED;
					row[9] = new Date().toUTCString();
					row[10] = await Util.getVatstatsLink(pilot.cid, row);
					
					// Check for diversion and announce arrival
					//client.channels.get("507568619987927040").send(`<@${row[1]}> has finished their flight from ${row[4]} to ${ row[8] && row[8] != "" ? row[8] : row[7]}`);

				// If we get here, we have no clue what the pilot is doing...
				} else {
					status = INVALIDSTAT;
					pilot.resetDepartStatus();
					console.log(`Pilot Reset from Two minute Timer: ${row[1]}`);
				}
			}

			if(!Util.statusEqual(row[3], status)) {
				changedData = true;
				row[3] = status;
				console.log(row[3]);
			}

			if(row[8] && row[8] != "")
				flightTableString += `**${row[2]}**: ${row[4]} - ${row[7]} | Diverting to ${row[8]}\nFlown by: *${row[0]}* - Status: ${row[3]}\n`;
			else
				flightTableString += `**${row[2]}**: ${row[4]} - ${row[7]}\nFlown by: *${row[0]}* - Status: ${row[3]}\n`;
			
		} else {
			//Check the time that they arrived. If less than 8 hours, add it to the arrived string
			if(Date.now() - Date.parse(row[9]) < 86400000) {
				if(row[8] && row[8] != "")
					arrivedTableString += `**${row[2]}**: ${row[4]} - ${row[7]} | Diverted to ${row[8]}\nFlown by: *${row[0]}*\n`;
				else 
					arrivedTableString += `**${row[2]}**: ${row[4]} - ${row[7]}\nFlown by: *${row[0]}*\n`;
			}
		}

		} catch (err) {
			console.log(err);
		}
		
	}

	//client.channels.get("596409775290450081").messages.fetch("596427894050390036").then(message => message.edit(flightTableString));
    //client.channels.get("596409775290450081").messages.fetch("599600791866703908").then(message => message.edit(arrivedTableString));

	//if(changedData) googleAuth.editSheets(client, "P3" + ":AA", flights);
	
	client.emit("pilotInfoUpdate");
}

module.exports = {
	PIEClient : PIEClient,
}
