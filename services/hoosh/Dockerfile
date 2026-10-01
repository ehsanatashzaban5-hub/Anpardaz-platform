FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY services/hoosh/package.json services/hoosh/package.json
COPY services/hoosh/tsconfig.json services/hoosh/tsconfig.json
RUN pnpm install --no-frozen-lockfile --ignore-scripts --filter @anpardaz/hoosh-service...
COPY services/hoosh/src services/hoosh/src
RUN pnpm --filter @anpardaz/hoosh-service build
RUN pnpm --filter @anpardaz/hoosh-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4008
CMD ["node","dist/main.js"]