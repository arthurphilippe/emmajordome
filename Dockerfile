FROM node:alpine AS build

WORKDIR /build

COPY package*.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

FROM node:alpine

WORKDIR /app

COPY --from=build /build/package.json /app

RUN yarn --prod

COPY --from=build /build/dist /app/dist

CMD [ "yarn", "start" ]
