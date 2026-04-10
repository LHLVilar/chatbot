const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode");

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

console.log("🚀 Iniciando aplicação...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: "new", // 🔥 importante
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check'
        ]
    }
});

const userStates = {};

client.on("qr", (qr) => {
    console.log("📲 QR RECEIVED");

    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Erro QR:", err);
            return;
        }
        console.log("👉 QR CODE:");
        console.log(url);
    });
});

client.on("loading_screen", (percent, message) => {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
});

client.on("authenticated", () => {
    console.log("✅ AUTHENTICATED");
});

client.on("ready", () => {
    console.log("🔥 CLIENT READY");
});

client.on("auth_failure", msg => {
    console.error("❌ AUTH FAILURE:", msg);
});

client.on("disconnected", reason => {
    console.log("⚠️ Desconectado:", reason);
    client.initialize();
});

client.on("message", async msg => {
    const chatId = msg.from;

    if (msg.body.toLowerCase() === "simular") {
        userStates[chatId] = { step: "awaiting_valor" };
        await msg.reply("Digite o valor total. Ex: 100");
    } 
    else if (userStates[chatId]?.step === "awaiting_valor") {
        const valorTotal = parseFloat(msg.body);

        if (isNaN(valorTotal)) {
            await msg.reply("Valor inválido.");
            return;
        }

        userStates[chatId].valorTotal = valorTotal;
        userStates[chatId].step = "awaiting_parcelas";

        await msg.reply("Em quantas vezes?");
    } 
    else if (userStates[chatId]?.step === "awaiting_parcelas") {
        const parcelas = parseInt(msg.body);

        if (isNaN(parcelas) || parcelas <= 0) {
            await msg.reply("Número inválido.");
            return;
        }

        const valorTotal = userStates[chatId].valorTotal;
        const resultado = (valorTotal / parcelas).toFixed(2);

        await msg.reply(`Resultado: ${parcelas}x de R$ ${resultado}`);
        delete userStates[chatId];
    } 
    else {
        await msg.reply("Digite 'Simular' para começar.");
    }
});

console.log("🔌 Inicializando WhatsApp...");
client.initialize();

app.get("/", (req, res) => {
    res.send("Bot rodando!");
});

app.listen(port, () => {
    console.log(`🌐 Server running on port ${port}`);
});
