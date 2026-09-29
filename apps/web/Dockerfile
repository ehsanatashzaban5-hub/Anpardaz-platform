FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild esbuild
COPY . .

ARG VITE_PLATFORM_API_URL=/platform
ARG VITE_ANSARRAF_API_URL=/ansarraf
ARG VITE_BANNER_API_URL=/banner
ENV VITE_PLATFORM_API_URL=$VITE_PLATFORM_API_URL
ENV VITE_ANSARRAF_API_URL=$VITE_ANSARRAF_API_URL
ENV VITE_BANNER_API_URL=$VITE_BANNER_API_URL
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
CMD ["nginx","-g","daemon off;"]
