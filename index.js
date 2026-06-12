require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');



const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

let recrutamento = {};

// BOT ONLINE
client.on('clientReady', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

// ENTRADA → RECRUTA
client.on('guildMemberAdd', async (member) => {
  const canal = member.guild.channels.cache.get(config.canalRecrutamento);
  const cargo = member.guild.roles.cache.get(config.cargoRecruta);

  if (cargo) await member.roles.add(cargo);

  if (canal) {
    canal.send(`⚔️ ${member}, use /registro para iniciar o recrutamento.`);
  }
});

// MENSAGENS
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // 🔹 COMANDOS
  if (msg.content === '!ping') {
    return msg.reply('🏓 Pong!');
  }

  if (msg.content === '!ajuda') {
    return msg.reply(`
📌 Comandos disponíveis:

!ping → testar bot  
!status → status do bot  
!recrutamento → como entrar  
    `);
  }

  if (msg.content === '!status') {
    return msg.reply('🤖 Bot online e funcionando.');
  }

  if (msg.content === '!recrutamento') {
    return msg.reply(`
⚔️ Para entrar:

Use /registro SeuNick  
Responda as perguntas  
Aguarde aprovação  
    `);
  }

  // 🔻 REGISTRO
  if (msg.content.startsWith('/registro')) {
    const nick = msg.content.split(' ')[1];

    if (!nick) {
      return msg.reply("Informe seu nick: /registro SeuNick");
    }

    recrutamento[msg.author.id] = { nick };

    return msg.reply("Responda:\n1. ZvZ?\n2. IP?\n3. Já teve guilda?");
  }

  // 🔻 RESPOSTAS
  if (recrutamento[msg.author.id] && !recrutamento[msg.author.id].finalizado) {
    recrutamento[msg.author.id].respostas = msg.content;
    recrutamento[msg.author.id].finalizado = true;

    const log = msg.guild.channels.cache.get(config.canalLog);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_${msg.author.id}`)
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`negar_${msg.author.id}`)
        .setLabel('Negar')
        .setStyle(ButtonStyle.Danger)
    );

    if (log) {
      log.send({
        content: `📌 Recruta\nNick: ${recrutamento[msg.author.id].nick}\nRespostas: ${msg.content}\nUsuário: ${msg.author.tag}`,
        components: [row]
      });
    }

    return msg.reply("Dados enviados. Aguarde análise.");
  }
});

// BOTÕES
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [acao, userId] = interaction.customId.split('_');

  const member = await interaction.guild.members.fetch(userId);
  const dados = recrutamento[userId];

  if (!member || !dados) {
    return interaction.reply({ content: "Usuário não encontrado.", ephemeral: true });
  }

  if (acao === 'aprovar') {
    await aprovar(member, dados.nick);

    await interaction.update({
      content: `✅ ${member.user.tag} aprovado`,
      components: []
    });
  }

  if (acao === 'negar') {
    await member.send("❌ Seu recrutamento foi recusado.");
    await member.kick();

    await interaction.update({
      content: `❌ ${member.user.tag} removido`,
      components: []
    });
  }
});

// APROVAÇÃO
async function aprovar(member, nick) {
  const cargoRecruta = member.guild.roles.cache.get(config.cargoRecruta);
  const cargoGuarda = member.guild.roles.cache.get(config.cargoGuarda);

  await member.setNickname(nick);

  if (cargoRecruta) await member.roles.remove(cargoRecruta);
  if (cargoGuarda) await member.roles.add(cargoGuarda);

  await member.send(`
✅ Recrutamento aprovado

Você agora é GUARDA da guilda.

Leia as regras e prepare-se.
  `);
}

// LOGIN
client.login(process.env.TOKEN);