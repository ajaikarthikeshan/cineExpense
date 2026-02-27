FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json next.config.js tailwind.config.js postcss.config.js ./
COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
