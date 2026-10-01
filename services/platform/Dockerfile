FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ip-region-policy/package.json packages/ip-region-policy/package.json
COPY packages/ip-region-policy packages/ip-region-policy
COPY services/platform/package.json services/platform/package.json
COPY services/platform/tsconfig.json services/platform/tsconfig.json
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @anpardaz/platform-service...
COPY services/platform/src services/platform/src
RUN pnpm --filter @anpardaz/platform-service build
RUN pnpm --filter @anpardaz/platform-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4003
CMD ["node","dist/main.js"]
