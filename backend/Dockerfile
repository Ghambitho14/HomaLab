FROM node:20-alpine

WORKDIR /app

# Copiar los archivos de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto
EXPOSE 3001

# Comando por defecto
CMD ["npm", "start"]