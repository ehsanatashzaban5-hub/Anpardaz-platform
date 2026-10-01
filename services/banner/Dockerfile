FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY packages/ip-region-policy/package.json packages/ip-region-policy/package.json
COPY packages/ip-region-policy packages/ip-region-policy
COPY services/banner/package.json services/banner/package.json
COPY services/banner/tsconfig.json services/banner/tsconfig.json
RUN pnpm install --no-frozen-lockfile --ignore-scripts --filter @anpardaz/banner-service...
COPY services/banner/src services/banner/src
RUN pnpm --filter @anpardaz/banner-service build
RUN pnpm --filter @anpardaz/banner-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4005
CMD ["node","dist/main.js"]
