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

# Default command
CMD ["bun", "packages/db/src/migrate.ts"]
