FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      libcairo2-dev \
      libgif-dev \
      libjpeg-dev \
      libpango1.0-dev \
      librsvg2-dev \
      pkg-config \
      python3 \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app
RUN chown node:node /app

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
USER node
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 5173
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0"]
