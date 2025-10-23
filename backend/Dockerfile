FROM node:20-alpine3.20

WORKDIR /app

COPY package.json package-lock.json ./

COPY prisma/schema.prisma ./prisma/

RUN npm install

COPY . .

RUN npm run prisma:generate

RUN npm run build

EXPOSE 3001

CMD [ "node", "dist/src/main.js" ]