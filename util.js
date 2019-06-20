const { readdirSync } = require('fs');

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
	return (pilotRow[8] != undefined && pilotRow[8] != "");
}

function hasPilotGaveLink(pilotRow) {
	return (pilotRow[9] != undefined && pilotRow[9] != "");
}

module.exports = {
	loadCommands,
	sleep,
	hasPilotArrived,
	hasPilotGaveLink,
}