module.exports = {
  enviarMensagem: async (canal, conteudo) => {
    try {
      await canal.send(conteudo);
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  }
};
