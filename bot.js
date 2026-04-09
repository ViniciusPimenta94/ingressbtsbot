const axios = require("axios");
const { chromium } = require("playwright");

const TOKEN = "8733969386:AAHs1L7j1YywkdlfV42p7335Q_rba81w-7k";
const CHAT_ID = "332527910";

const URL = "https://www.ticketmaster.com.br/event/bts-world-tour-arirang";

async function enviarMensagem(msg) {
  await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: msg,
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(URL);

  console.log("Monitorando...");

  setInterval(async () => {
    try {
      await page.reload();

      const conteudo = await page.content();

      if (!conteudo.includes("ESGOTADO")) {
        console.log("🔥 DISPONÍVEL!");
        await enviarMensagem("🚨 INGRESSO DISPONÍVEL! Corre!");
      } else {
        console.log("Ainda esgotado...");
      }
    } catch (err) {
      console.log("Erro:", err.message);
    }
  }, 15000);
})();