FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY apps/web/package.json ./package.json
RUN pnpm install --ignore-scripts
RUN pnpm rebuild esbuild
ENV VITE_PLATFORM_API_URL=
ENV VITE_ANPARDAZ_API_URL=/anpardaz
ENV VITE_ANSARRAF_API_URL=/ansarraf
ENV VITE_BANNER_API_URL=/banner
COPY apps/web/ ./
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
CMD ["nginx","-g","daemon off;"]
