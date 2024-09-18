// index.js

const { Client, GatewayIntentBits, EmbedBuilder, MessageEmbed } = require('discord.js');
const cron = require('node-cron');
require('dotenv').config();

// BASE DE DADOS DE ANIVERSÁRIOS
const birthdays = require('./database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// AO FICAR NO AR
client.once('ready', () => {
    //Variáveis de data
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // getMonth() retorna de 0 a 11
    console.log(currentDay, currentMonth);
    console.log(`Bot online como ${client.user.tag}!`);

    // Configura a tarefa para rodar todo dia à meia-noite
    cron.schedule('0 0 * * *', () => {
        birthdays.forEach((birthday) => {
            if (birthday.day === currentDay && birthday.month === currentMonth) {
                const channel = client.channels.cache.get('771512122534133761'); // ID do canal que quero exibir as mensagens
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setColor(0x0099ff)
                        .setTitle(`🎉 Hoje é aniversário de ${birthday.name}! 🎉`)
                        .setDescription(
                            `Hoje é aniversário de <@${birthday.userId}>! ${birthday.message}`
                        )
                        .setThumbnail(
                            'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif'
                        )
                        .setImage(
                            'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif'
                        );
                    channel.send({
                        embeds: [embed],
                    });
                } else {
                    console.log('Canal não encontrado!');
                }
            }
        });
    });
});

// Crianção da lista de comandos caso seja marcado o bot
client.on('messageCreate', (message) => {
    // Ignora mensagens enviadas pelo próprio bot
    if (message.author.bot) return;

    // Verifica se a mensagem menciona o bot
    if (message.mentions.has(client.user)) {
        // Lista de comandos disponíveis
        const commandsList = `
**Aqui estão os comandos disponíveis:**
- **!aniversarios**: Mostra todos os aniversários da galera.
- **!mes**: Mostra os aniversáriantes do mês atual.
- **!proximos**: Mostra os próximos aniversários, os dias até o próximo aniversário de cada um.
`;

        // Envia a lista de comandos no canal onde o comando foi chamado
        message.channel.send(commandsList);
    }
});

// Crianção de um comando - Verificar aniversarios de todo mundo
client.on('messageCreate', (message) => {
    if (message.content === '!aniversarios') {
        const BirthdayEmbed = new EmbedBuilder()
            .setColor('#FFDD00') // Cor do cabeçalho
            .setTitle('🎂 Aniversários da galera 🎉')
            .setThumbnail(
                'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif'
            ) // Thumbnail
            .setFooter({
                text: 'Fique atento para celebrar os aniversários!',
                iconURL:
                    'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif',
            });

        // Ordena os aniversários por dia e mês
        const sortedBirthdays = birthdays.slice().sort((a, b) => {
            return a.month - b.month || a.day - b.day;
        });

        sortedBirthdays.forEach((birthday) => {
            BirthdayEmbed.addFields([
                {
                    name: `🎈 ${birthday.name} (${birthday.day}/${birthday.month})`,
                    value: `<@${birthday.userId}>`, // Menção do usuário
                },
            ]);
        });

        // Envia a lista de aniversários no canal onde o comando foi chamado
        message.channel.send({ embeds: [BirthdayEmbed] });
    }
});

// Criação de outro comando - Ver aniversariantes do mês do atual
client.on('messageCreate', (message) => {
    if (message.content === '!mes') {
        //Variáveis de data
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1; // getMonth() retorna de 0 a 11

        let birthdayListMonth = '🎂 **Aniversáriantes do mês atual** 🎉\n';
        let birthdayListMonthUsers = '';

        const monthBirthdayEmbed = new EmbedBuilder()
            .setColor('#FFDD00') // Cor do cabeçalho
            .setTitle('🎂 Aniversariantes deste mês🎉')
            .setThumbnail(
                'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif'
            ) // Thumbnail
            .setFooter({
                text: 'Fique atento para celebrar os aniversários!',
                iconURL:
                    'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif',
            });

        birthdays.forEach((birthday) => {
            if (birthday.month === currentMonth) {
                monthBirthdayEmbed.addFields(
                    {
                        name: `🎈 ${birthday.name} (${birthday.day}/${birthday.month})`,
                        value: `<@${birthday.userId}>\n\n\n`,
                    },
                    { name: '\u200B', value: '\u200B' }
                );
            }
        });

        if (birthdayListMonthUsers.length == 0) {
            birthdayListMonth = `⏰ **Nenhum aniversáriante no mês atual** (mês ${currentMonth})`;
        }

        message.channel.send({ embeds: [monthBirthdayEmbed] });
    }
});

// Criação de outro comando - Mostrar próximos aniversários mais próximos
client.on('messageCreate', (message) => {
    //Variáveis de data
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // getMonth() retorna de 0 a 11

    if (message.content === '!proximos') {
        // Função para calcular a data do próximo aniversário
        const getNextBirthdayDate = (birthday) => {
            let birthdayDate = new Date(currentYear, birthday.month - 1, birthday.day); // Mês é 0-indexado
            if (birthdayDate < today) {
                // Se a data já passou neste ano, definir para o próximo ano
                birthdayDate.setFullYear(currentYear + 1);
            }
            return birthdayDate;
        };

        // Calculando e ordenando os aniversários mais próximos
        const upcomingBirthdays = birthdays
            .map((birthday) => ({
                ...birthday,
                date: getNextBirthdayDate(birthday),
            }))
            .sort((a, b) => a.date - b.date);

        // Criando uma embed
        const upcomingBirthdayEmbed = new EmbedBuilder()
            .setColor('#FFDD00') // Cor do cabeçalho
            .setTitle('🎂 Próximos Aniversários do Servidor 🎉')
            .setThumbnail(
                'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif'
            ) // Thumbnail
            .setFooter({
                text: 'Fique atento para celebrar os aniversários!',
                iconURL:
                    'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif',
            });

        // Adicionando os próximos aniversários à embed
        upcomingBirthdays.forEach((birthday) => {
            const daysUntilBirthday = Math.ceil((birthday.date - today) / (1000 * 60 * 60 * 24)); // Diferença em dias
            upcomingBirthdayEmbed.addFields({
                name: `🎈 ${birthday.name} (${birthday.day}/${birthday.month})`,
                value: `<@${birthday.userId}> **${daysUntilBirthday}** dias restantes\n\n\n`,
            });
        });

        message.channel.send({ embeds: [upcomingBirthdayEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
