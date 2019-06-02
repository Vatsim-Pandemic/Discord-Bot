const https = require("https");
const async = require("async");
const Util = require("../util.js");

module.exports = {
	getAirport: getAirport,
};

const airportMap = new Map();
const failedAirportMap = new Map();
const queue = async.queue(downloadAirport, 2);


function downloadAirport(icao, callback) {
	if(airportMap.has(icao)) return callback(undefined, airportMap.get(icao));
	if(failedAirportMap.has(icao)) return callback(new Error(icao + " not found previously"));

	const options = {
		host: "fshub.io",
		path: `/api/v3/airport/${icao}`,
		method: "get",
		headers: {
			"X-Pilot-Token": "UkKvvyWAWhWRwZpZQCyUxZFAyg1Z5ZN3rxaDs2edQlSeYqRVX9jgoYleXLwl",
		}
	}

	console.log("Retrieving Airport Info: " + icao);

	https.get(options, res =>{
		let body = "";

		res.on("error", err => {
			return callback(err);
		});

		res.on("data", data => {
			body += data;
		});

		res.on("end", async () => {
			try {
				body = JSON.parse(body);
			}
			catch(err) {
				await Util.sleep(60000);
				return downloadAirport(icao, callback);
			}

			if(body.error) {
				failedAirportMap.set(icao, body);
				return callback(new Error(icao + " not found"));
			}

			airportMap.set(icao, body);
			//console.log(JSON.stringify(body));
			return callback(undefined, body);
		});
	});
}

/**
 * Get airport information from an internal map, or request the data from FSHub
 * @param {String} icao
 */
async function getAirport(icao) {
	return new Promise((resolve, reject) => {
		queue.push(icao, (err, airport) => {
			if(err) {
				reject(err);
			}
			 else {
				resolve(airport);
			}
		});
	});
}