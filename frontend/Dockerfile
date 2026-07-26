# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Empty by default so the app fetches from the same origin (relative URLs)
# and relies on the nginx reverse proxy to reach the backend.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# LogRocket app/project ID, injected at build time (Vite bakes env vars in).
ARG VITE_LOGROCKET_ID=
ENV VITE_LOGROCKET_ID=$VITE_LOGROCKET_ID

RUN npm run build

# ── Serve stage ───────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
