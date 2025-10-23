FROM node:20-alpine

ARG NEXT_PUBLIC_API_URL

# Next.js가 빌드 및 런타임에 읽을 수 있도록 ENV로 설정합니다.
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "start" ]