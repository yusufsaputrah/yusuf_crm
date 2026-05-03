# Menggunakan image Node.js versi 18 Alpine yang ringan
FROM node:18-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin seluruh kode sumber frontend
COPY . .

# Ekspose port 3000
EXPOSE 3000

# Perintah untuk menjalankan frontend di mode development dengan host terbuka
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
