FROM node:24-alpine AS build
WORKDIR /repo

RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY packages/ip-region-policy/package.json packages/ip-region-policy/package.json
COPY packages/ip-region-policy packages/ip-region-policy
COPY services/platform/package.json services/platform/package.json
COPY services/platform/tsconfig.json services/platform/tsconfig.json

RUN pnpm install --no-frozen-lockfile --filter @anpardaz/platform-service...
COPY services/platform/src services/platform/src
RUN pnpm --filter @anpardaz/platform-service build
RUN pnpm --filter @anpardaz/platform-service deploy --prod /out

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4003
CMD ["node","dist/main.js"]
