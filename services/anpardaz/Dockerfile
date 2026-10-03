FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ip-region-policy/package.json packages/ip-region-policy/package.json
COPY packages/ip-region-policy packages/ip-region-policy
COPY services/anpardaz/package.json services/anpardaz/package.json
COPY services/anpardaz/tsconfig.json services/anpardaz/tsconfig.json
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @anpardaz/anpardaz-service...
COPY services/anpardaz/src services/anpardaz/src
RUN pnpm --filter @anpardaz/anpardaz-service build
RUN pnpm --filter @anpardaz/anpardaz-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4001
CMD ["node","dist/main.js"]
