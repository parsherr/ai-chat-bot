const { Client, GatewayIntentBits, Events, ActivityType, Collection } = require('discord.js');
const fetch = require('node-fetch');
const { token } = require('./ayarlar');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });
client.cooldowns = new Collection();

function logBotInfo() {
    console.log(`Giriş yapıldı: ${client.user.tag}`);
    console.log(`Sunucu sayısı: ${client.guilds.cache.size}`);
    console.log(`Kullanıcı sayısı: ${client.users.cache.size}`);
}
//Ücretsiz Apiler İçin https://msii.xyz
client.once('ready', () => {
    logBotInfo();
    registerSlashCommands();
    client.user.setActivity('Gelişmiş Yapay Zeka Botu', { type: ActivityType.Playing });
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    let content = message.content;
    if (!content.startsWith('!sor')) return;

    const question = content.replace('!sor', '').trim();
    if (!question) return;

    const now = Date.now();
    const timestamps = client.cooldowns.get('sor');
    const cooldownAmount = 10 * 1000; 

    if (timestamps && timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = Math.ceil((expirationTime - now) / 1000);
            return message.reply(`Lütfen ${timeLeft} saniye bekleyin ve tekrar deneyin.`);
        }
    }

    if (!client.cooldowns.has('sor')) {
        client.cooldowns.set('sor', new Collection());
    }
    client.cooldowns.get('sor').set(message.author.id, now);
    setTimeout(() => client.cooldowns.get('sor').delete(message.author.id), cooldownAmount);

    try {
        await message.channel.sendTyping();
        const response = await fetch(`https://msii.xyz/api/yapay-zeka?soru=${encodeURIComponent(question)}`);
        const data = await response.json();
        
        if (data && data.reply) {
            message.reply(data.reply);
            console.log(`Soru soruldu: ${question} | Kullanıcı: ${message.author.tag}`);
        } else {
            message.reply("Bir hata oluştu, lütfen tekrar deneyin.");
        }
    } catch (error) {
        console.error(error);
        message.reply("Bir hata oluştu, lütfen tekrar deneyin.");
    }
});
//Parsher Code
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'sor') {
        const question = interaction.options.getString('soru');

        if (!question) return;

        const now = Date.now();
        const timestamps = client.cooldowns.get('sor');
        const cooldownAmount = 10 * 1000; 

        if (timestamps && timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - now) / 1000);
                return interaction.reply(`Lütfen ${timeLeft} saniye bekleyin ve tekrar deneyin.`);
            }
        }

        if (!client.cooldowns.has('sor')) {
            client.cooldowns.set('sor', new Collection());
        }
        client.cooldowns.get('sor').set(interaction.user.id, now);
        setTimeout(() => client.cooldowns.get('sor').delete(interaction.user.id), cooldownAmount);

        try {
            await interaction.deferReply();

            const response = await fetch(`https://msii.xyz/api/yapay-zeka?soru=${encodeURIComponent(question)}`);
            const data = await response.json();
                
            if (data && data.reply) {
                await interaction.editReply(data.reply);
                console.log(`Slash komut kullanıldı: ${question} | Kullanıcı: ${interaction.user.tag}`);
            } else {
                await interaction.editReply("Bir hata oluştu, lütfen tekrar deneyin.");
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply("Bir hata oluştu, lütfen tekrar deneyin.");
        }
    }
});
//Msi
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

function registerSlashCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('sor')
            .setDescription('Gelişmiş Yapay Zekaya Soru Sor!')
            .addStringOption(option => 
                option.setName('soru')
                    .setDescription('Sormak istediğiniz soru')
                    .setRequired(true))
    ].map(command => command.toJSON());

    const rest = new REST({ version: '9' }).setToken(token);

    rest.put(Routes.applicationCommands(client.user.id), { body: commands })
        .then(() => console.log('Başarıyla komutlar kaydedildi.'))
        .catch(console.error);
}

client.login(token);