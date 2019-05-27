const Discord = require('discord.js');
const { prefix, token, spreadsheetId, range, valueInputOption } = require('./config.json');
const creds = require('./client-secret.json');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');

const client = new Discord.Client();

const gClient = new JWT(
	creds.client_email,
	null,
	creds.private_key,
	['https://www.googleapis.com/auth/spreadsheets'],
);

const auth = gClient.authorize(function(err) {
	if(err) throw err;
	else console.log('Sucess');
});

let sheets = google.sheets({ version: 'v4', auth });

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === 'dep') {
		const values = [
			[message.author.username, args[0], args[1], message.createdAt.toUTCString(), null, args[2]],
		  ];

		  const resource = {
			values,
		  };
		  sheets.spreadsheets.values.update({
			spreadsheetId,
			range,
			valueInputOption,
			resource,
		  }, (err, result) => {
			if (err) {
			  // Handle error
			  console.log(err);
			} else {
			  console.log('%d cells updated.', result.updatedCells);
			}
		  });

	}
	else if(command === 'arr') {
		const arrData = [message.author, args[3], message.createdAt.toUTCString()];


	}

});

client.login(token);