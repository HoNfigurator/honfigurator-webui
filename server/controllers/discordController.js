const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const myIntents = new IntentsBitField();
myIntents.add(IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMembers);

const client = new Client({ intents: '' });
client.login(process.env.BOT_TOKEN);

async function validateUser(discordId) {
    const user = await client.users.fetch(discordId);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

function createEmbedMessage(title, description, fields, thumbnailUrl, footerText) {
    let embed = new EmbedBuilder()
        .setColor('#FF5733') // You can make this a parameter too if you want different colors for different messages
        .setTitle(title)
        .setDescription(description);

    if (fields && fields.length > 0) {
        embed.addFields(...fields);
    }

    if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
    }

    if (footerText) {
        embed.setFooter({ text: footerText });
    }

    return embed;
}


async function sendMessageToDiscordUser(discordId, embed) {
    try {
        const user = await validateUser(discordId);
        await user.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Error in sending message: ${error}`);
        throw error;
    }
}


module.exports = { sendMessageToDiscordUser, createEmbedMessage };