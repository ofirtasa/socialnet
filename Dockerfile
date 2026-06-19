FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
EXPOSE 3000
CMD ["npm", "start"]

FROM deps AS seed
COPY . .
CMD ["npx", "tsx", "seed-runner.ts"]
