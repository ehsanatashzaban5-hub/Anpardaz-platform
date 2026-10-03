FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/market/package.json services/market/package.json
COPY services/market/tsconfig.json services/market/tsconfig.json
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @anpardaz/market-service...
COPY services/market/src services/market/src
RUN pnpm --filter @anpardaz/market-service build
RUN pnpm --filter @anpardaz/market-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4007
CMD ["node","dist/main.js"]
