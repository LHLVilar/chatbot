const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    }
});

// Temporary storage for user states (in a real app, use a database)
const userStates = {};

client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Error generating QR code", err);
            return;
        }
        console.log("QR Code URL:", url);
    });
});

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on("message", async msg => {
    console.log("MESSAGE RECEIVED", msg.body);
    const chatId = msg.from;

    if (msg.body.toLowerCase() === "simular") {
        userStates[chatId] = { step: "awaiting_valor" };
        await msg.reply("Olá! Para simular uma divisão, por favor, me diga o valor total que deseja dividir. Ex: 100");
    } else if (userStates[chatId] && userStates[chatId].step === "awaiting_valor") {
        const valorTotal = parseFloat(msg.body.trim());
        if (isNaN(valorTotal)) {
            await msg.reply("Valor inválido. Por favor, digite um número. Ex: 100");
            return;
        }
        userStates[chatId].valorTotal = valorTotal;
        userStates[chatId].step = "awaiting_parcelas";
        await msg.reply(`Ok, você quer dividir ${valorTotal}. Agora, em quantas vezes deseja parcelar? Ex: 4`);
    } else if (userStates[chatId] && userStates[chatId].step === "awaiting_parcelas") {
        const parcelas = parseInt(msg.body.trim());
        if (isNaN(parcelas) || parcelas <= 0) {
            await msg.reply("Número de parcelas inválido. Por favor, digite um número inteiro positivo. Ex: 4");
            return;
        }
        const valorTotal = userStates[chatId].valorTotal;
        const resultado = (valorTotal / parcelas).toFixed(2);
        await msg.reply(`Resultado: Dividir ${valorTotal} em ${parcelas} vezes resulta em parcelas de R$ ${resultado} cada. ✅`);
        delete userStates[chatId]; // Clear state after completion
    } else {
        await msg.reply("Desculpe, não entendi. Digite 'Simular' para iniciar uma nova simulação.");
    }
});

client.initialize();

app.get("/", (req, res) => {
    res.send("WhatsApp Chatbot is running!");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
