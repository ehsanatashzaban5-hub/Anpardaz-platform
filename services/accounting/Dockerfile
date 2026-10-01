FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY packages/ip-region-policy/package.json packages/ip-region-policy/package.json
COPY packages/ip-region-policy packages/ip-region-policy
COPY services/accounting/package.json services/accounting/package.json
COPY services/accounting/tsconfig.json services/accounting/tsconfig.json
RUN pnpm install --no-frozen-lockfile --ignore-scripts --filter @anpardaz/accounting-service...
COPY services/accounting/src services/accounting/src
RUN pnpm --filter @anpardaz/accounting-service build
RUN pnpm --filter @anpardaz/accounting-service deploy --prod --legacy /out

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4004
CMD ["node","dist/main.js"]
