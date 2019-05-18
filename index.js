const Discord = require('discord.js');
const { prefix, token, sheetID, departureCells } = require('./config.json');
const creds = require('./client-secret.json');
const GoogleSpreadsheet = require('google-spreadsheet');
let sheet = '';

const doc = new GoogleSpreadsheet(sheetID);
const client = new Discord.Client();

doc.useServiceAccountAuth(creds, (err) => {
	if (err) {
		throw err;
	}
	console.log('Auth Sucessful');
});

doc.getInfo(function(err, info) {
	sheet = info.worksheets[0];
});

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === 'dep') {
		const depData = [message.author.username, args[0], args[1], message.createdAt.toUTCString(), args[2]];

		sheet.getCells({
			'min-row': startingRow,
			'min-col': 16,
			'max-col': 23,
		}, (err, cells) => {
			if(err) throw err;

			for (let i = 0; i < 5; i++) {
				const cell = cells[departureCells[i]];
				cell.value = depData[i];
				cell.save();
			}
			message.channel.send('you have been dispached.');
			startingRow++;
		});
	}
	else if(command === 'arr') {
		const arrData = [message.author, args[3], message.createdAt.toUTCString()];


	}

});

client.login(token);