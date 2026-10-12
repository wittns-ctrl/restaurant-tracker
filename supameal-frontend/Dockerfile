# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SOCIAL_FACEBOOK_URL=
ARG VITE_SOCIAL_INSTAGRAM_URL=
ARG VITE_SOCIAL_X_URL=
ARG VITE_SOCIAL_LINKEDIN_URL=
ARG VITE_SUPPORT_EMAIL=support@supameal.com
ARG VITE_CAREERS_EMAIL=careers@supameal.com
ENV VITE_SOCIAL_FACEBOOK_URL=$VITE_SOCIAL_FACEBOOK_URL \
    VITE_SOCIAL_INSTAGRAM_URL=$VITE_SOCIAL_INSTAGRAM_URL \
    VITE_SOCIAL_X_URL=$VITE_SOCIAL_X_URL \
    VITE_SOCIAL_LINKEDIN_URL=$VITE_SOCIAL_LINKEDIN_URL \
    VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL \
    VITE_CAREERS_EMAIL=$VITE_CAREERS_EMAIL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime stage: nginx serves the static bundle ───────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
