const { readdirSync } = require('fs');
const http = require('https');

const vatstatsLink = "https://beta-api.vatstats.net/external_api/cid_profiles/";
const vatstatsFlight = "https://vatstats.net/flights/";
//data = JSON.parse(await Util.getWebsiteData("https://beta-api.vatstats.net/external_api/cid_profiles/1287709/"));
//console.log(data.last_50_flights);

function loadCommands(client) {
	client.commands.clear();
	client.aliases.clear();

	const files = readdirSync(`./Commands/`);

	console.log("loading " + files.length + " commands");

	// Get every command within the ./Commands folder
	files.forEach(file => {
		const key = file.toLowerCase().replace(".js", "");
		const command = require(`./Commands/${file}`);

		// Bind the key to the command.
		client.commands.set(key, command);

		if(command.aliases) {
			command.aliases.forEach(alias => {
				// Set the alias to the command name/key to allow command reloading without updating aliases
				client.aliases.set(alias, key);
			});
		}

	});
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function hasPilotArrived(pilotRow) {
	return (pilotRow[9] != undefined && pilotRow[9] != "");
}

function hasPilotGaveLink(pilotRow) {
	return (pilotRow[10] != undefined && pilotRow[10] != "");
}

async function getWebsiteData(host, path) {
	return new Promise((resolve, reject) => {
		console.log(`Contacting: ${host}`);

		data = "";

		if(path == undefined){
			path = "";
		}

		let parsedURL = new URL(host + path);

		http.request(parsedURL , function(res){
			res.on('data', function(chunk){
				data += chunk.toString();
			});

			res.on('end', () => {
				resolve(data);
			});
		}).on('error', (err) => {
			reject(err);
		}).end();
	});
}

async function getVatstatsLink(vatsimID, row) {
	const data = JSON.parse(await getWebsiteData(vatstatsLink + vatsimID + "/"));
	// Dept = 4th index, arrv = 7th index, alt = 8th index

	const lastFlight = data.last_50_flights[0];

	// If last vatstats destination does not equal the alternate or destination in sheets, return error
	if(lastFlight.planned_dest_airport__icao.toLowerCase() != row[7].toLowerCase() && lastFlight.planned_dest_airport__icao.toLowerCase() != row[8].toLowerCase()) return "Last flight does not match Vatstat records";

	// If no alternate, just return last flight
	if(row[8] == undefined || row[8] == "") return vatstatsFlight + lastFlight.id;

	let flightsLink = "";

	// Assuming we are dealing with multiple vatstats link -> loop until we find the original flight
	for(flightIndex in data.last_50_flights) {
		const flight = data.last_50_flights[flightIndex];
		
		flightsLink += vatstatsFlight + flight.id + ", ";
		if(flight.planned_dep_airport__icao.toLowerCase() == row[4].toLowerCase() && flight.planned_dest_airport__icao.toLowerCase() == row[7].toLowerCase()) break;
	}

	return flightsLink;
}

module.exports = {
	loadCommands,
	sleep,
	hasPilotArrived,
	hasPilotGaveLink,
	getWebsiteData,
	getVatstatsLink,
}