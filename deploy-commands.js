const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { clientId, guildId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');

const commands = [];
// Get all of the commands from the command folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Check if the command has a data and an execute property
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(commands);
    } else {
        console.log(`[WARNING] The command at ${path.join(commandsPath, file)} is missing a required "data" or "execute" property.`);
    }
}

//Create and get the instance ready for the rest Module
const rest = new REST({ version: '9'}).setToken(token);
console.log(rest);
//deploy the commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        //use put to refresh all commands in the guild with the current set of commands
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId), 
            { body: commands },
        );

        console.log(`I have successfully reloaded all of ${data.length} slash commands`);
    } catch (err) {
        //log any error if they come up.
        console.error(err);
    }
});