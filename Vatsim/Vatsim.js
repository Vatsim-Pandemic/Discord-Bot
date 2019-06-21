const http = require('http');
const {URL} = require('url');
const newLine = "\u000A";
const UserParser = require("./UserParser");

const TWO_MINUTE_INTERVAL = 200000;

const vatsimStatus = {
	host: "http://status.vatsim.net",
	path: "/status.txt",
}

const clientData = [];
let statusData;

let vatsimTimer;

let pilotUpdateCallback;

/**
 * Use the Vatsim link to get all of the links which we can get information from.
 */
async function init(callback) {
	try {
		statusData = await getWebsiteData(vatsimStatus.host, vatsimStatus.path);
	} catch(err) {
		console.error("Could not get Vatsim Links! " + err);
		return;
	}

	let lines = statusData.split(newLine);

	for(lineIndex in lines){
		let line = lines[lineIndex];
		if(line.startsWith(";")) continue;
		if(line.startsWith("url0")) {
			let link = line.split("=")[1];
			link = link.replace("\r", "");
			clientData.push(link);
		};
		
	}

	vatsimTimer = setInterval(update, TWO_MINUTE_INTERVAL);

	pilotUpdateCallback = callback;

	update(); //Get data from Vatsim
}

/**
 * Update data within each individual parser by giving a random link given by the original vatsim link
 */
async function update(){
	console.log("----------------------");
	console.log("Vatsim Update: " + new Date().toUTCString());
	let random = Math.round(Math.random() * (clientData.length - 1));

	let userData;
	
	try{
		userData = await getWebsiteData(clientData[random]);
	} catch(err){
		throw new Error("Could not get user data!\n" + err);
	}

	await UserParser.parseURL(userData);

	console.log("Updated User Info");

	if(pilotUpdateCallback) pilotUpdateCallback();
}

function getPilot(callsign){
	try{
		return UserParser.getPilot(callsign);
	} catch(err){
		throw err;
	}
}

module.exports = {
	init: init,
	update: update,
	getPilot: getPilot,
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