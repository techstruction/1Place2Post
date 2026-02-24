FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# wget is used by the Docker healthcheck
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm ci --omit=dev
# Copy compiled app, prisma schema, AND generated client from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 35763
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:35763/api/health || exit 1
CMD ["node", "dist/main.js"]
