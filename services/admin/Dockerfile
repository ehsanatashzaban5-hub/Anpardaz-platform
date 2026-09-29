FROM node:24-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services/admin ./services/admin
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @anpardaz/admin-service build
USER node
ENV NODE_ENV=production
EXPOSE 4005
CMD ["node","services/admin/dist/main.js"]