FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Para desarrollo, instalar nodemon
RUN npm install --save-dev nodemon

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 5000

# Comando por defecto
CMD ["node", "src/index.js"]
