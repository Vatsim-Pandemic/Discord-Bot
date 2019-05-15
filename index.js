const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

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

		message.channel.send(`Data Stored: ${depData}`);

	}

});

client.login(token);