require("dotenv").config();

const config = require("./config.json");
const db = require("./database/sqlite");

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

// ================= CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ================= READY =================
client.once("ready", () => {
    console.log(`🤖 Bot online: ${client.user.tag}`);
});

// ================= NOVO MEMBRO =================
client.on("guildMemberAdd", async (member) => {

    try {

        const cargoRecruta =
            member.guild.roles.cache.get(config.cargoRecruta);

        if (cargoRecruta) {
            await member.roles.add(cargoRecruta);
        }

        console.log(
            `${member.user.tag} recebeu cargo Recruta`
        );

    } catch (err) {
        console.error(
            "Erro ao adicionar cargo Recruta:",
            err
        );
    }

});

// ================= INTERAÇÕES =================
client.on("interactionCreate", async (interaction) => {

// ================= SLASH COMMAND =================
if (interaction.isChatInputCommand()) {

    // ===== /REGISTRO =====
    if (interaction.commandName === "registro") {

        if (interaction.channel.id !== config.canalRecrutamento) {
            return interaction.reply({
                content: "❌ Use este comando no canal de recrutamento.",
                ephemeral: true
            });
        }

        const isStaff =
            interaction.member.roles.cache.has(config.cargoLider) ||
            interaction.member.roles.cache.has(config.cargoComandante);

        if (isStaff) {
            return interaction.reply({
                content: "❌ Staff não pode se registrar.",
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId("modal_registro")
            .setTitle("📋 Cadastro de Recrutamento");

        const nick = new TextInputBuilder()
            .setCustomId("nick")
            .setLabel("Seu Nick")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const arma = new TextInputBuilder()
            .setCustomId("arma")
            .setLabel("Arma Favorita")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const horario = new TextInputBuilder()
            .setCustomId("horario")
            .setLabel("Horário que joga")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const ip = new TextInputBuilder()
            .setCustomId("ip")
            .setLabel("Seu IP")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nick),
            new ActionRowBuilder().addComponents(arma),
            new ActionRowBuilder().addComponents(horario),
            new ActionRowBuilder().addComponents(ip)
        );

        return interaction.showModal(modal);
    }

    // ===== /PAINEL =====
    if (interaction.commandName === "painel") {

        const isStaff =
            interaction.member.roles.cache.has(config.cargoLider) ||
            interaction.member.roles.cache.has(config.cargoComandante);

        if (!isStaff) {
            return interaction.reply({
                content: "❌ Apenas staff pode usar este comando.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("📋 Painel de Recrutamento")
            .setDescription("Use /registro para iniciar um recrutamento.")
            .setColor("Blue");

        return interaction.reply({
            embeds: [embed]
        });
    }

    // ===== /CLEAR =====
    if (interaction.commandName === "clear") {

        const isStaff =
            interaction.member.roles.cache.has(config.cargoLider) ||
            interaction.member.roles.cache.has(config.cargoComandante);

        if (!isStaff) {
            return interaction.reply({
                content: "❌ Apenas staff pode usar este comando.",
                ephemeral: true
            });
        }

        const quantidade =
            interaction.options.getInteger("quantidade");

        if (quantidade < 1 || quantidade > 100) {
            return interaction.reply({
                content: "❌ Escolha um valor entre 1 e 100.",
                ephemeral: true
            });
        }

        await interaction.channel.bulkDelete(
            quantidade,
            true
        );

        return interaction.reply({
            content: `🗑️ ${quantidade} mensagens apagadas.`,
            ephemeral: true
        });
    }
}

    // ================= MODAL SUBMIT =================
    if (interaction.isModalSubmit()) {

        if (interaction.customId === "modal_registro") {

            await interaction.deferReply({ ephemeral: true });

            const nick = interaction.fields.getTextInputValue("nick");
            const arma = interaction.fields.getTextInputValue("arma");
            const horario = interaction.fields.getTextInputValue("horario");
            const ip = interaction.fields.getTextInputValue("ip");

            // evita duplicado
            db.get(
                `SELECT * FROM recrutamentos WHERE discord_id=? AND status='PENDENTE'`,
                [interaction.user.id],
                (err, existente) => {

                    if (existente) {
                        return interaction.editReply({
                            content: "❌ Você já possui um registro pendente."
                        });
                    }

                    // salva no banco
                    db.run(
                        `INSERT INTO recrutamentos 
                        (discord_id, nick, arma, horario, ip, status) 
                        VALUES (?, ?, ?, ?, ?, 'PENDENTE')`,
                        [interaction.user.id, nick, arma, horario, ip]
                    );

                    // embed dashboard
                    const embed = new EmbedBuilder()
                        .setTitle("📋 Novo Recrutamento")
                        .setColor("Yellow")
                        .addFields(
                            { name: "👤 Nick", value: nick, inline: true },
                            { name: "⚔️ Arma", value: arma, inline: true },
                            { name: "🕒 Horário", value: horario, inline: true },
                            { name: "🌍 IP", value: ip, inline: true }
                        )
                        .setFooter({ text: `ID: ${interaction.user.id}` })
                        .setTimestamp();

                    const botoes = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`aprovar_${interaction.user.id}`)
                            .setLabel("✅ Aprovar")
                            .setStyle(ButtonStyle.Success),

                        new ButtonBuilder()
                            .setCustomId(`negar_${interaction.user.id}`)
                            .setLabel("❌ Negar")
                            .setStyle(ButtonStyle.Danger)
                    );

                    const canalLog = client.channels.cache.get(config.canalLog);

                    if (canalLog) {
                        canalLog.send({
                            embeds: [embed],
                            components: [botoes]
                        });
                    }

                    return interaction.editReply({
                        content: "✅ Cadastro enviado para análise!"
                    });
                }
            );
        }
    }

    // ================= BOTÕES =================
    if (!interaction.isButton()) return;

    const isStaff =
        interaction.member.roles.cache.has(config.cargoLider) ||
        interaction.member.roles.cache.has(config.cargoComandante);

    if (!isStaff) {
        return interaction.reply({
            content: "❌ Apenas staff pode usar isso.",
            ephemeral: true
        });
    }

    const match = interaction.customId.match(/(aprovar|negar)_(.+)/);
    if (!match) return;

    const acao = match[1];
    const userId = match[2];

    await interaction.deferUpdate();

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    db.get(
        `SELECT * FROM recrutamentos WHERE discord_id=? AND status='PENDENTE'`,
        [userId],
        (err, dados) => {

            if (!dados) return;

            // ===== APROVAR =====
            if (acao === "aprovar") {

                db.run(`UPDATE recrutamentos SET status='APROVADO' WHERE id=?`, [dados.id]);

                const cargoGuarda =
    interaction.guild.roles.cache.get(config.cargoGuarda);

const cargoRecruta =
    interaction.guild.roles.cache.get(config.cargoRecruta);

if (cargoRecruta) {
    member.roles.remove(cargoRecruta).catch(() => {});
}

if (cargoGuarda) {
    member.roles.add(cargoGuarda).catch(() => {});
}
                member.setNickname(dados.nick).catch(() => {});

                member.send("✅ Você foi aprovado no recrutamento!").catch(() => {});

                interaction.followUp({
                    content: `✅ ${dados.nick} aprovado.`,
                    ephemeral: true
                });
            }

            // ===== NEGAR =====
            if (acao === "negar") {

                db.run(`UPDATE recrutamentos SET status='RECUSADO' WHERE id=?`, [dados.id]);

                member.send("❌ Você foi recusado no recrutamento.").catch(() => {});

                interaction.followUp({
                    content: `❌ ${dados.nick} recusado.`,
                    ephemeral: true
                });
            }
        }
    );
});

client.login(process.env.TOKEN);
