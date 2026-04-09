const axios = require("axios");
const { chromium } = require("playwright");

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const URL = "https://www.ticketmaster.com.br/event/bts-world-tour-arirang";

let jaNotificou = false;

async function enviarMensagem(msg) {
  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: msg,
    });
  } catch (err) {
    console.log("Erro ao enviar mensagem:", err.message);
  }
}

(async () => {
  try {
    console.log("🚀 Iniciando bot...");

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: "domcontentloaded" });

    console.log("👀 Monitorando ingressos...");

    setInterval(async () => {
      try {
        await page.reload({ waitUntil: "domcontentloaded" });

        // Pega todos os textos dos botões
        const botoes = await page.locator("button").allTextContents();

        // Verifica se existe botão de compra
        const temDisponivel = botoes.some(texto =>
          texto.toLowerCase().includes("comprar") ||
          texto.toLowerCase().includes("ingressos")
        );

        if (temDisponivel && !jaNotificou) {
          console.log("🔥 INGRESSO DISPONÍVEL!");
          await enviarMensagem("🚨 INGRESSO DISPONÍVEL! Corre comprar!");
          jaNotificou = true;
        } else {
          console.log("Ainda esgotado...");
        }

      } catch (err) {
        console.log("Erro no loop:", err.message);
      }
    }, 20000); // verifica a cada 20s

  } catch (err) {
    console.error("Erro geral:", err);
  }
})();