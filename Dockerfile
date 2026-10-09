FROM node:22-alpine

LABEL org.opencontainers.image.title="ConectorREDMINE"
LABEL org.opencontainers.image.description="MCP server for Redmine (stdio + HTTP)"
LABEL org.opencontainers.image.source="https://github.com/EngRocha1/ConectorREDMINE"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY .env.example ./

ENV NODE_ENV=production
ENV PORT=3100

EXPOSE 3100

# Default: HTTP mode for Grok custom connector / remote MCP
CMD ["node", "src/http-server.js"]
