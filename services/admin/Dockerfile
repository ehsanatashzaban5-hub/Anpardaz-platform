FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY packages/ip-region-policy/package.json packages/ip-region-policy/package.json
COPY packages/ip-region-policy packages/ip-region-policy
COPY services/admin/package.json services/admin/package.json
COPY services/admin/tsconfig.json services/admin/tsconfig.json
RUN pnpm install --no-frozen-lockfile --ignore-scripts --filter @anpardaz/admin-service...
COPY services/admin/src services/admin/src
RUN pnpm --filter @anpardaz/admin-service build
RUN pnpm --filter @anpardaz/admin-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4006
CMD ["node","dist/main.js"]