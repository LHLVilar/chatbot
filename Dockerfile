FROM node:18-bullseye

# Instalar dependências do Chromium
RUN apt-get update && apt-get install -y \
    chromium-browser \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos
COPY package*.json ./
RUN npm install

COPY . .

# Expor porta
EXPOSE 10000

# Rodar aplicação
CMD ["node", "index.js"]
