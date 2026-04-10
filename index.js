const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 10000;

let qrPath = "./qr.png";

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote'
        ]
    }
});

client.on("qr", async (qr) => {
    console.log("📲 QR RECEIVED");

    try {
        await qrcode.toFile(qrPath, qr);
        console.log("✅ QR salvo em /qr");
    } catch (err) {
        console.error("Erro ao gerar QR:", err);
    }
});

client.on("ready", () => {
    console.log("✅ Bot conectado!");
});

client.initialize();

app.get("/", (req, res) => {
    res.send("Bot rodando!");
});

app.get("/qr", (req, res) => {
    if (fs.existsSync(qrPath)) {
        res.sendFile(__dirname + "/qr.png");
    } else {
        res.send("QR ainda não gerado.");
    }
});

app.listen(port, () => {
    console.log(`🌐 Server rodando na porta ${port}`);
});
