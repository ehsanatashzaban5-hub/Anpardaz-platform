FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY apps/admin/package.json ./package.json
RUN pnpm install --ignore-scripts
COPY apps/admin/ ./
ENV VITE_ADMIN_API_URL=
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
CMD ["nginx","-g","daemon off;"]
