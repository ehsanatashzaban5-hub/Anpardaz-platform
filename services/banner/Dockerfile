FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json tsconfig.json ./
RUN pnpm install --no-frozen-lockfile
COPY src ./src
RUN pnpm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4005
CMD ["node","dist/main.js"]
