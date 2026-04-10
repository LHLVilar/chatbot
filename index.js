const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 10000;

let qrPath = path.join(__dirname, "qr.png");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // "new" foi descontinuado em versões recentes, true é mais seguro
        // Usamos o caminho direto do Chromium instalado no seu Dockerfile para evitar erros de ambiente
        executablePath: '/usr/bin/chromium', 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            // O User-Agent abaixo é CRUCIAL para evitar o bloqueio de região/dispositivo
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    }
});

client.on("qr", async (qr) => {
    console.log("📲 QR RECEIVED");

    try {
        await qrcode.toFile(qrPath, qr);
        console.log("✅ QR salvo em /qr.png");
    } catch (err) {
        console.error("Erro ao gerar QR:", err);
    }
});

client.on("ready", () => {
    console.log("✅ Bot conectado!");
    // Remove o QR code após conectar para segurança
    if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
    }
});

client.initialize();

app.get("/", (req, res) => {
    res.send("Bot rodando!");
});

app.get("/qr", (req, res) => {
    if (fs.existsSync(qrPath)) {
        res.sendFile(qrPath);
    } else {
        res.send("QR ainda não gerado ou já conectado.");
    }
});

app.listen(port, () => {
    console.log(`🌐 Server rodando na porta ${port}`);
});
