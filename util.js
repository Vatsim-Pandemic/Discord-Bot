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

module.exports = {
	loadCommands
}