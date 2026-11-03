# Una imagen por servicio: docker build --build-arg SERVICE=api-gateway .
# SERVICE: api-gateway | core-user-service | market-service
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG SERVICE
RUN npx nest build "$SERVICE"
RUN npm prune --omit=dev

FROM node:24-slim
ARG SERVICE
ENV NODE_ENV=production
ENV SERVICE=$SERVICE
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN mkdir -p uploads private-uploads && chown -R node:node uploads private-uploads
USER node
# exec: node recibe SIGTERM directamente y puede cerrar de forma ordenada
CMD ["sh", "-c", "exec node dist/apps/$SERVICE/main.js"]
