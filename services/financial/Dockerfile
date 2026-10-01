FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY services/financial/package.json services/financial/package.json
COPY services/financial/tsconfig.json services/financial/tsconfig.json
RUN pnpm install --no-frozen-lockfile --ignore-scripts --filter @anpardaz/financial-service...
COPY services/financial/src services/financial/src
RUN pnpm --filter @anpardaz/financial-service build
RUN pnpm --filter @anpardaz/financial-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4009
CMD ["node","dist/main.js"]