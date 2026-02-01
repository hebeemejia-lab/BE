FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias incluyendo nodemon para desarrollo
RUN npm ci && npm install --save-dev nodemon

# Copiar código fuente
COPY . .

# Crear directorio para migración
RUN mkdir -p logs

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando por defecto
CMD ["npm", "start"]
