FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app
RUN chown node:node /app

COPY --chown=node:node package.json pnpm-lock.yaml ./
USER node
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 3001
CMD ["pnpm", "exec", "nodemon", "--legacy-watch", "src/server.js"]
