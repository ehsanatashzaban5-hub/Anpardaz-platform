FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_PLATFORM_API_URL=/platform
ARG VITE_ANSARRAF_API_URL=/ansarraf
ARG VITE_BANNER_API_URL=/banner
ARG VITE_MARKET_API_URL=/market
ARG VITE_HOOSH_API_URL=/hoosh
ARG VITE_FINANCIAL_API_URL=/financial
ENV VITE_PLATFORM_API_URL=$VITE_PLATFORM_API_URL
ENV VITE_ANSARRAF_API_URL=$VITE_ANSARRAF_API_URL
ENV VITE_BANNER_API_URL=$VITE_BANNER_API_URL
ENV VITE_MARKET_API_URL=$VITE_MARKET_API_URL
ENV VITE_HOOSH_API_URL=$VITE_HOOSH_API_URL
ENV VITE_FINANCIAL_API_URL=$VITE_FINANCIAL_API_URL
RUN pnpm build

FROM nginx:1.29-alpine AS runtime
COPY apps/web/nginx-prod.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
