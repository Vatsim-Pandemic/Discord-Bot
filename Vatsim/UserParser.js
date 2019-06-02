const newLine = "\u000A";
const airportTolerance = 1 / 60;
const altitudeTolerance = 200;
const FSHost = require('./FSHost.js');

const pilots = new Map();

function parseURL(url) {
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
				if(!pilots.has(line[0])) {
					const pilot = new VatsimPilot(line.split(":"));
					pilots.set(pilot.callsign, pilot);
				} else {
					pilots.get(line[0]).update(line);
				}
			}
		}
	}

	console.log("Updated information for " + pilotCounter + " pilots");
}

function parsePilotController(line) {
	const pilotLine = line.split(":");
	if(pilotLine[3] == undefined) return false;

	return pilotLine[3].indexOf("PILOT") > -1;
}

function getPilot(callsign) {
	console.log(callsign);
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

		const tempDep = inputArray[11];
		const tempArr = inputArray[13];

		if(tempDep != "" && tempArr != "") {
			this.getAirports(tempDep, tempArr);
		}

		this.updateInfo(inputArray);
		//
	}

	async getAirports(dep, arr) {
		if( !(this.callsign.startsWith("IHS") || this.callsign.startsWith("UNO"))) return;
		this.departure = await FSHost.getAirport(dep).catch((err) => {
			console.error(err);
			this.airportDetectionFailed = true;
			return;
		});
		this.arrival = await FSHost.getAirport(arr).catch((err) => {
			console.error(err);
			this.airportDetectionFailed = true;
			return;
		});
		this.updateDepartureArrival();
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

					this.arrived = errLat < airportTolerance && errLng < airportTolerance && this.groundspeed == 0;
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

		const tempDep = inputArray[11];
		const tempArr = inputArray[13];

		if((tempDep != this.plannedDepartingAirport || tempArr != this.plannedDestinationAirport)
			&& tempDep != "" && tempArr != "") {
			this.departed = false;
			this.arrived = false;
			this.getAirports(tempDep, tempArr);
		}
		else if (!this.airportDetectionFailed) {
			this.updateDepartureArrival();
		}

		this.updateInfo(inputArray);
	}
}