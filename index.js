/* Project Dependecies*/
const { Client, Events, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, Collection } = require('discord.js');

const fs = require('fs');
const path = require ('path');


/* File Dependecies */
const { token } = require('./config.json').token;
// Create and intalized datadb if it doesn't exist


/* Constant Variables */
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
] }); // Permission stuff for discord api
client.commands = new Collection();

// Intalizie and create the commands collection
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync( commandsPath ).filter( file => file.endsWith( 'js' ));

//iterate through all command files and add them to the commaned collection
for (const file of commandFiles ){
    const filePath = path.join( commandsPath, file );
    const command = require( filePath );
    // Add each item into the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) { 
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Send an message to console saying that the bot is now online
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// run when ever a slash command is ran and for this both specifically
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;
    // try to find the command if it does not exist spit out an error and let the user know that an error has occured, While spitting out the error code into the console.
    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true});
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true});
        }
    }
})


// Run whenever a message is sent in the discord.
client.on('messageCreate', async message => {
    // for testing.
        console.log(await message);
    
})

client.login(token);