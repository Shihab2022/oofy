FROM node:24-alpine

WORKDIR /app

# Prisma needs openssl for the Postgres client
RUN apk add --no-cache openssl

COPY package.json ./
RUN npm install

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

RUN npx prisma generate
RUN npm run build

ENV PORT=5000
EXPOSE 5000

# Migration + seed are run by the entrypoint in docker-compose or manually
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]
