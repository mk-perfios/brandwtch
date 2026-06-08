FROM node:20-alpine

WORKDIR /app

# Install dependencies (no lockfile required)
COPY package.json ./
RUN npm install

# Copy source (overridden by the bind mount in docker-compose for live reload)
COPY . .

EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

CMD ["npm", "run", "dev"]
