export function loadCommands() {
	commands.clear();

	const files = fs.readdirSync(`./Commands/`);

	console.log("loading " + files.length + " commands");

	// Get every command within the ./Commands folder
	files.forEach(file => {
		const key = file.toLowerCase().replace(".js", "");
		const command = require(`./Commands/${file}`);

		// Bind the key to the command.
		commands.set(key, command);

		if(command.aliases) {
			command.aliases.forEach(alias => {
				// Set the alias to the command name/key to allow command reloading without updating aliases
				aliases.set(alias, key);
			});
		}

	});
}