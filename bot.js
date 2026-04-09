const axios = require("axios");
const { chromium } = require("playwright");

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const URL = "https://www.ticketmaster.com.br/event/bts-world-tour-arirang";

let jaNotificou = false;

// métricas
let totalChecks = 0;
let totalErros = 0;
let totalDisponivel = 0;
let ultimaExecucao = new Date();

// heartbeat
let ultimoHeartbeat = Date.now();

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

function gerarRelatorio() {
  const agora = new Date();

  return `
📊 Relatório diário

🔎 Verificações: ${totalChecks}
🔥 Disponível detectado: ${totalDisponivel}
⚠️ Erros: ${totalErros}
🕒 Última execução: ${ultimaExecucao.toLocaleString("pt-BR")}
  `;
}

// calcula tempo até 09:00
function calcularDelayPara9h() {
  const agora = new Date();
  const proximo = new Date();

  proximo.setHours(9, 0, 0, 0);

  if (agora >= proximo) {
    proximo.setDate(proximo.getDate() + 1);
  }

  return proximo - agora;
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

    // 🔁 LOOP PRINCIPAL
    setInterval(async () => {
      try {
        await page.reload({ waitUntil: "domcontentloaded" });

        totalChecks++;
        ultimaExecucao = new Date();
        ultimoHeartbeat = Date.now();

        const botoes = await page.locator("button").allTextContents();

        const temDisponivel = botoes.some(texto =>
          texto.toLowerCase().includes("comprar ingressos")
        );

        if (temDisponivel && !jaNotificou) {
          console.log("🔥 INGRESSO DISPONÍVEL!");
          await enviarMensagem("🚨 INGRESSO DISPONÍVEL! Corre comprar!");
          totalDisponivel++;
          jaNotificou = true;
        } else {
          console.log("Ainda esgotado...");
        }

      } catch (err) {
        totalErros++;
        console.log("Erro no loop:", err.message);
      }
    }, 60000); // 60s

    // 📊 RELATÓRIO DIÁRIO ÀS 09:00
    const iniciarRelatorio = () => {
      const delay = calcularDelayPara9h();

      setTimeout(() => {
        setInterval(async () => {
          try {
            console.log("📊 Enviando relatório diário...");
            await enviarMensagem(gerarRelatorio());

            // reset
            totalChecks = 0;
            totalErros = 0;
            totalDisponivel = 0;

          } catch (err) {
            console.log("Erro no relatório:", err.message);
          }
        }, 86400000); // 24h

      }, delay);
    };

    iniciarRelatorio();

    // ❤️ HEARTBEAT (detecta se travou)
    setInterval(async () => {
      const agora = Date.now();

      // se ficou mais de 2 minutos sem rodar
      if (agora - ultimoHeartbeat > 120000) {
        console.log("🚨 BOT POSSIVELMENTE PARADO!");

        await enviarMensagem(
          "⚠️ ALERTA: O bot pode ter parado de executar corretamente!"
        );
      }
    }, 60000);

  } catch (err) {
    console.error("Erro geral:", err);

    await enviarMensagem(
      "🚨 ERRO CRÍTICO: O bot falhou ao iniciar!"
    );
  }
})();