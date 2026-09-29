FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY packages/ip-region-policy/package.json packages/ip-region-policy/package.json
COPY packages/ip-region-policy packages/ip-region-policy
COPY services/ansarraf/package.json services/ansarraf/package.json
COPY services/ansarraf/tsconfig.json services/ansarraf/tsconfig.json
RUN pnpm install --no-frozen-lockfile --ignore-scripts --filter @anpardaz/ansarraf-service...
COPY services/ansarraf/src services/ansarraf/src
RUN pnpm --filter @anpardaz/ansarraf-service build
RUN pnpm --filter @anpardaz/ansarraf-service deploy --prod --legacy /out
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out ./
USER node
EXPOSE 4002
CMD ["node","dist/main.js"]
