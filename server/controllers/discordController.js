const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMembers);

const client = new Client({ intents: '' });
client.login(process.env.BOT_TOKEN);

async function sendMessageToDiscordUser(discordId, timeLagged, serverInstance, serverName, matchId) {
    try {
        // Validate that the provided discordId corresponds to the stored server + discord owner ID
        
        const user = await client.users.fetch(discordId);
        if (user) {
            const timeLaggedSeconds = (timeLagged / 1000).toFixed(2); // Convert to seconds

            // Create an embed with fields for each piece of information
            const embed = new EmbedBuilder()
                .setColor('#FF5733') // Set the color of the embed
                .setTitle('Server Side Lag Detected') // Set the title of the embed
                .setDescription('I’ve detected an unusual lag spike on your server.') // Set the description of the embed
                .addFields(
                    { name: 'Server Name', value: serverName, inline: true },
                    { name: 'Match ID', value: matchId.toString(), inline: true },
                    { name: 'Total Duration of Lag', value: `${timeLaggedSeconds} seconds`, inline: true }
                )
                .setThumbnail('https://i.ibb.co/YdSTNV9/Hon-Figurator-Icon1c.png')
                .setFooter({text:'Server side lag is usually to do with the CPU performance, but can also be caused by very active disk I/O. If problems continue, you can reduce your total server count.'});

            // Send the embed to the user
            await user.send({ embeds: [embed] });
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error(`Error in sending message: ${error}`);
        throw error; // rethrow the error to be handled by the caller
    }
}

module.exports = { sendMessageToDiscordUser };