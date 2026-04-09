const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode");
const puppeteer = require("puppeteer"); // 👈 IMPORTANTE

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: puppeteer.executablePath(), // 🔥 CORREÇÃO AQUI
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions'
        ]
    }
});

const userStates = {};

client.on("qr", (qr) => {
    console.log("QR RECEIVED");

    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Error generating QR code", err);
            return;
        }
        console.log("QR Code (cole no navegador):");
        console.log(url);
    });
});

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on("auth_failure", msg => {
    console.error("AUTHENTICATION FAILURE", msg);
});

client.on("disconnected", reason => {
    console.log("Client was logged out", reason);
    client.initialize(); // 🔁 reconecta automático
});

client.on("message", async msg => {
    console.log("MESSAGE RECEIVED", msg.body);
    const chatId = msg.from;

    if (msg.body.toLowerCase() === "simular") {
        userStates[chatId] = { step: "awaiting_valor" };
        await msg.reply("Olá! Para simular uma divisão, me diga o valor total. Ex: 100");
    } 
    else if (userStates[chatId] && userStates[chatId].step === "awaiting_valor") {
        const valorTotal = parseFloat(msg.body.trim());

        if (isNaN(valorTotal)) {
            await msg.reply("Valor inválido. Digite um número. Ex: 100");
            return;
        }

        userStates[chatId].valorTotal = valorTotal;
        userStates[chatId].step = "awaiting_parcelas";

        await msg.reply(`Ok, você quer dividir ${valorTotal}. Em quantas vezes? Ex: 4`);
    } 
    else if (userStates[chatId] && userStates[chatId].step === "awaiting_parcelas") {
        const parcelas = parseInt(msg.body.trim());

        if (isNaN(parcelas) || parcelas <= 0) {
            await msg.reply("Número inválido. Digite um inteiro positivo. Ex: 4");
            return;
        }

        const valorTotal = userStates[chatId].valorTotal;
        const resultado = (valorTotal / parcelas).toFixed(2);

        await msg.reply(`Resultado: ${parcelas}x de R$ ${resultado} ✅`);

        delete userStates[chatId];
    } 
    else {
        await msg.reply("Digite 'Simular' para começar.");
    }
});

client.initialize();

app.get("/", (req, res) => {
    res.send("WhatsApp Chatbot is running!");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
