# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

# Empty by default so the app fetches from the same origin (relative URLs)
# and relies on the nginx reverse proxy to reach the backend.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Serve stage ───────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
