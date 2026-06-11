FROM node:20-alpine

WORKDIR /app/server

COPY server/package*.json ./
COPY server/prisma ./prisma
RUN npm install

COPY server/ ./
COPY src/shared /app/src/shared

RUN npx prisma generate

EXPOSE 8787

CMD ["sh", "-c", "npx prisma db push && npm run dev"]
