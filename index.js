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
    // Configura a tarefa para rodar todo dia à meia-noite
    cron.schedule(
        '0 0 * * *',
        () => {
            const today = new Date();
            const currentDay = today.getDate();
            const currentMonth = today.getMonth() + 1; // getMonth() retorna de 0 a 11

            birthdays.forEach((birthday) => {
                if (birthday.day === currentDay && birthday.month === currentMonth) {
                    const channel = client.channels.cache.get('712456040154660939'); // ID do canal que quero exibir as mensagens
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
        },
        {
            scheduled: true,
            timezone: 'America/Sao_Paulo', // Define o fuso horário de São Paulo
        }
    );
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
    let today = new Date();
    let currentYear = today.getFullYear();
    let currentDay = today.getDate();
    let currentMonth = today.getMonth() + 1; // getMonth() retorna de 0 a 11

    if (message.content === '!mes') {
        //Variáveis de data

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

// Função para calcular o próximo aniversário
const getNextBirthdayDate = (birthday) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    let birthdayDate = new Date(currentYear, birthday.month - 1, birthday.day); // Mês é 0-indexado
    if (birthdayDate < today) {
        // Se o aniversário já passou este ano, definir para o próximo ano
        birthdayDate.setFullYear(currentYear + 1);
    }
    return birthdayDate;
};

// Função para enviar os próximos aniversários em múltiplas mensagens
async function sendUpcomingBirthdays(message, upcomingBirthdays) {
    const maxFieldsPerEmbed = 25;
    const today = new Date();
    let currentEmbed = new EmbedBuilder()
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

    // Itera sobre os aniversários e cria embeds
    upcomingBirthdays.forEach((birthday, index) => {
        if (index > 0 && index % maxFieldsPerEmbed === 0) {
            // Envia o embed atual quando atingir 25 campos
            message.channel.send({ embeds: [currentEmbed] });
            currentEmbed = new EmbedBuilder()
                .setColor('#FFDD00')
                .setTitle('🎂 Próximos Aniversários do Servidor 🎉')
                .setThumbnail(
                    'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif'
                )
                .setFooter({
                    text: 'Fique atento para celebrar os aniversários!',
                    iconURL:
                        'https://mir-s3-cdn-cf.behance.net/project_modules/hd/279f0158060483.59ee4e804c846.gif',
                });
        }

        const daysUntilBirthday = Math.ceil((birthday.date - today) / (1000 * 60 * 60 * 24)); // Diferença em dias

        // Adiciona o aniversário ao embed
        currentEmbed.addFields({
            name: `🎈 ${birthday.name} (${birthday.day}/${birthday.month})`,
            value: `<@${birthday.userId}> **${daysUntilBirthday}** dias restantes\n\n\n`,
        });
    });

    // Envia o último embed se houver campos restantes
    if (currentEmbed.data.fields.length > 0) {
        message.channel.send({ embeds: [currentEmbed] });
    }
}

// Criação do comando para mostrar os próximos aniversários
client.on('messageCreate', (message) => {
    if (message.content === '!proximos') {
        const today = new Date();

        // Calculando e ordenando os aniversários mais próximos
        const upcomingBirthdays = birthdays
            .map((birthday) => ({
                ...birthday,
                date: getNextBirthdayDate(birthday),
            }))
            .sort((a, b) => a.date - b.date);

        // Envia os aniversários em múltiplas mensagens
        sendUpcomingBirthdays(message, upcomingBirthdays);
    }
});

client.login(process.env.DISCORD_TOKEN);
