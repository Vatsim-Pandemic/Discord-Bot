const fs = require('fs');
const Discord = require('discord.js');
const { google } = require('googleapis');
const { prefix, token, sheetID } = require('./config.json');
const creds = require('./client-secret.json');
const GoogleSpreadsheet = require('google-spreadsheet')

const doc = new GoogleSpreadsheet(sheetID);

doc.useServiceAccountAuth(creds, (err) => {
	if (err) {
		throw err;
	}
	console.log('Auth Sucessful');
});

const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === 'dep') {
		const depData = [message.author, args, message.createdAt.toUTCString()];

		// Getting cells back from tab #2 of the file
		doc.getCells(1, callback);

		// Callback function determining what to do with the information
		function callback(err, rows) {
			
			// Logging the output or error, depending on how the request went
			console.log(rows);
			console.log(err);
		}

	}
	else if(command === 'arr') {
		const arrData = [message.author, args[3], message.createdAt.toUTCString()];

		// doc.useServiceAccountAuth(creds, function(err) {

		// Getting cells back from tab #2 of the file
		doc.getCells(1, callback);

		// Callback function determining what to do with the information
		function callback(err, rows) {

			// Logging the output or error, depending on how the request went
			console.log(rows);
			console.log(err);
		}
		// });
	}

});

client.login(token);