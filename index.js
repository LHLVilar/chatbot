const express = require('express');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: false }));

// Configurar credenciais do Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Armazenar estados dos usuários
const userStates = {};

// Webhook para receber mensagens
app.post('/webhook', (req, res) => {
    const incomingMessage = req.body.Body;
    const from = req.body.From;
    const to = req.body.To;

    console.log(`Mensagem de ${from}: ${incomingMessage}`);

    let responseMessage = '';

    if (incomingMessage.toLowerCase() === 'simular') {
        userStates[from] = { step: 'awaiting_valor' };
        responseMessage = 'Olá! Para simular uma divisão, por favor, me diga o valor total que deseja dividir. Ex: 100';
    } else if (userStates[from] && userStates[from].step === 'awaiting_valor') {
        const valorTotal = parseFloat(incomingMessage.trim());
        if (isNaN(valorTotal)) {
            responseMessage = 'Valor inválido. Por favor, digite um número. Ex: 100';
        } else {
            userStates[from].valorTotal = valorTotal;
            userStates[from].step = 'awaiting_parcelas';
            responseMessage = `Ok, você quer dividir ${valorTotal}. Agora, em quantas vezes deseja parcelar? Ex: 4`;
        }
    } else if (userStates[from] && userStates[from].step === 'awaiting_parcelas') {
        const parcelas = parseInt(incomingMessage.trim());
        if (isNaN(parcelas) || parcelas <= 0) {
            responseMessage = 'Número de parcelas inválido. Por favor, digite um número inteiro positivo. Ex: 4';
        } else {
            const valorTotal = userStates[from].valorTotal;
            const resultado = (valorTotal / parcelas).toFixed(2);
            responseMessage = `Resultado: Dividir ${valorTotal} em ${parcelas} vezes resulta em parcelas de R$ ${resultado} cada. ✅`;
            delete userStates[from];
        }
    } else {
        responseMessage = "Desculpe, não entendi. Digite 'Simular' para iniciar uma nova simulação.";
    }

    // Enviar resposta
    client.messages.create({
        body: responseMessage,
        from: to,
        to: from
    }).then(() => {
        res.send('<Response></Response>');
    }).catch(err => {
        console.error('Erro ao enviar mensagem:', err);
        res.status(500).send('Erro ao enviar mensagem');
    });
});

// Rota de teste
app.get('/', (req, res) => {
    res.send('WhatsApp Chatbot com Twilio está rodando!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
