const newLine = "\u000A";
const airportTolerance = 1 / 30;
const altitudeTolerance = 200;
const FSHost = require('./FSHost.js');

const pilots = new Map();

async function parseURL(url) {
	const lines = url.split(newLine);

	let parsePilots = false;

	let pilotCounter = 0;

	for(const lineIndex in lines) {
		const line = lines[lineIndex];
		if(line.startsWith(";")) continue;
		if(line.startsWith("!CLIENTS:")) parsePilots = true;
		if(line.startsWith("!SERVERS:")) parsePilots = false;

		if(parsePilots) {

			if(parsePilotController(line)) {
				pilotCounter++;
				const lines = line.split(":");
				if(!pilots.has(lines[0].toLowerCase())) {
					const pilot = new VatsimPilot(lines);
					await pilot.update(lines);
					pilots.set(pilot.callsign.toLowerCase(), pilot);
				} else {
					pilots.get(lines[0].toLowerCase()).update(lines);
				}
			}
		}
	}

	let deleteCounter = 0;

	pilots.forEach((value, key, map) => {
		if(Date.now() - value.lastUpdate.getTime() > 300000) {
			pilots.delete(key);
			deleteCounter++;
		}
	});

	console.log("Removed " + deleteCounter + " pilots");

	console.log("Updated information for " + pilotCounter + " pilots");
}

function parsePilotController(line) {
	const pilotLine = line.split(":");
	if(pilotLine[3] == undefined) return false;

	return pilotLine[3].indexOf("PILOT") > -1;
}

function getPilot(callsign) {
	if(pilots.has(callsign)) return pilots.get(callsign);
	throw new Error("Pilot not found");
}

module.exports = {
	getPilot: getPilot,
	parseURL: parseURL,
};

class VatsimUser {

	// callsign;
	// cid;
	// realName;
	// clientType;
	// latitude;
	// longitude;
	// altitude;
	// plannedTasCruise;
	// server;
	// protrevision;
	// rating;
	// logonTime;

	constructor(inputArray) {
		this.updateParent(inputArray);
	}

	updateParent(inputArray) {
		this.callsign = inputArray[0];
		this.cid = parseInt(inputArray[1]);
		this.realName = inputArray[2];
		this.clientType = inputArray[3];
		this.latitude = parseFloat(inputArray[5]);
		this.longitude = parseFloat(inputArray[6]);
		this.altitude = parseInt(inputArray[7]);
		this.plannedTasCruise = parseInt(inputArray[10]);
		this.server = inputArray[14];
		this.protrevision = parseInt(inputArray[15]);
		this.rating = inputArray[16];
		this.logonTime = parseInt(inputArray[37]);
	}
}

class VatsimPilot extends VatsimUser {

	// groundspeed;
	// plannedAircraft;
	// plannedDepartingAirport;
	// plannedAltitude;
	// plannedDestinationAirport;
	// transponder;
	// plannedRevision;
	// plannedFlightType;
	// plannedDepartTime;
	// ActualDepartTime;
	// plannedHoursEnroute;
	// plannedMinuteEnroute;
	// plannedHoursFuel;
	// plannedMinutesFuel;
	// plannedAlternateAirport;
	// plannedRemarks;
	// plannedRoute;
	// plannedDepartureAirportLat;
	// plannedDepartureAirportLong;
	// heading;
	// QNHhg;
	// QNHmb;

	constructor(inputArray) {
		super(inputArray);

		this.departed = false;
		this.arrived = false;
		this.lastUpdate = new Date();
		this.airportDetectionFailed = true;

		const tempDep = inputArray[11];
		const tempArr = inputArray[13];
	}

	async getAirports(dep, arr) {
		try {
			this.departure = await FSHost.getAirport(dep);
			this.arrival = await FSHost.getAirport(arr);
		} catch (err) {
			this.airportDetectionFailed = true;
			return;
		}
		
		this.airportDetectionFailed = false;
	}

	updateDepartureArrival() {
		if(this.arrival && this.departure && this.departure.data && this.arrival.data) {
			try {
				// Check if departed
				if(!this.departed) {
					// this.departure.data.geo.lat/lng
					// console.log(JSON.stringify(this.departure));
					const errLat = Math.abs(this.latitude - this.departure.data.geo.lat);
					const errLng = Math.abs(this.longitude - this.departure.data.geo.lng);
					this.departed = errLat > airportTolerance && errLng > airportTolerance;
				}
			}
			catch (err) {
				console.error(this.plannedDepartingAirport + " Error getting geo departing");
			}

			try{
				// Check if arrived if the plane has departed on same update
				if(this.departed) {
					const errLat = Math.abs(this.latitude - this.arrival.data.geo.lat);
					const errLng = Math.abs(this.longitude - this.arrival.data.geo.lng);
					this.arrived = errLat < airportTolerance && errLng < airportTolerance && this.groundspeed < 30;
				}
			}
			catch (err) {
				console.error(this.plannedDestinationAirport + " Error getting geo arrival\n" + err);
				console.error(JSON.stringify(this.arrival.data.geo));
			}

		}
	}

	/**
	 * Private method which updates the information
	 * @param {String} inputArray
	 */
	updateInfo(inputArray) {
		this.groundspeed = parseInt(inputArray[8]);
		this.plannedAircraft = inputArray[9];
		this.plannedDepartingAirport = inputArray[11];
		this.plannedAltitude = parseInt(inputArray[12]);
		this.plannedDestinationAirport = inputArray[13];
		this.transponder = inputArray[14];
		this.plannedRevision = parseInt(inputArray[20]);
		this.flightType = inputArray[21];
		this.plannedDepartTime = parseInt(inputArray[22]);
		this.actualDepartTime = parseInt(inputArray[23]);
	}

	async update(inputArray) {
		super.updateParent(inputArray);
		this.lastUpdate = new Date();

		const tempDep = inputArray[11].trim();
		const tempArr = inputArray[13].trim();

		if((tempDep != this.plannedDepartingAirport || tempArr != this.plannedDestinationAirport)
			&& tempDep != "" && tempArr != "") {
			//console.log(`New Airports detected: ${this.callsign} ${tempDep}-${tempArr} != ${this.plannedDepartingAirport}-${this.plannedDestinationAirport} AirportDetection ${this.airportDetectionFailed}`);
			this.departed = false;
			this.arrived = false;
			await this.getAirports(tempDep, tempArr);
		}

		this.updateInfo(inputArray);

		if (!this.airportDetectionFailed) {
			this.updateDepartureArrival();
		}
	}

	resetDepartStatus() {
		this.departed = false;
		this.arrived = false;
	}
}