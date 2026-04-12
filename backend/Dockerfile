FROM node:18-alpine

WORKDIR /app

# Copiar los archivos de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]