const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('replies with ping'),
    async execute(interaction) {
        return interaction.reply('ping');
    },
};