require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

    // ===== /REGISTRO =====
    new SlashCommandBuilder()
        .setName("registro")
        .setDescription("Fazer recrutamento"),

    // ===== /PAINEL =====
    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Abrir painel de recrutamento"),

    // ===== /CLEAR =====
    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Apagar mensagens do canal")
        .addIntegerOption(opt =>
            opt.setName("quantidade")
                .setDescription("Quantidade de mensagens (1 a 100)")
                .setRequired(true)
        )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("🔄 Registrando comandos...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("✅ Comandos registrados!");
    } catch (error) {
        console.error(error);
    }
})();