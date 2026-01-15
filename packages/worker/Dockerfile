FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Copy root workspace files
COPY package.json bun.lock ./

# Copy package definitions
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/
COPY packages/worker/package.json packages/worker/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY packages/worker packages/worker

# Run worker
WORKDIR /usr/src/app/packages/worker
CMD ["bun", "run", "start"]
