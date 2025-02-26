# Multi-stage build for the Node.js application

# Stage 1: Build Stage
FROM node:20.11.0 AS builder

# Set working directory
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV APP_HOME=/usr/src/app
WORKDIR $APP_HOME

# Copy dependency files and install dependencies
COPY package.json ./
RUN npm install --production=true
RUN npm i sequelize
RUN npm i sequelize-cli

# Copy application code and build
COPY . .
RUN npm run build

# Remove unnecessary files to keep the image clean
RUN rm -rf src package.json package-lock.json

# Stage 2: Runtime Stage
FROM node:20.11.0

# Set working directory
ENV APP_HOME=/usr/src/app
WORKDIR $APP_HOME
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true


# Install SSH server
RUN apt-get update \
    && apt-get install -y --no-install-recommends dialog \
    && apt-get install -y --no-install-recommends openssh-server \
    && mkdir /var/run/sshd


# Install dependencies for Puppeteer (including Chromium dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libu2f-udev \
  libxshmfence1 \
  libglu1-mesa \
  chromium \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*



# Set root password for SSH access (for demo purposes; change for production)
RUN echo "root:Docker!" | chpasswd

# Copy SSH configuration and entrypoint script from the azure directory
COPY azure/sshd_config /etc/ssh/sshd_config
COPY azure/entrypoint ./entrypoint

# Set execute permission for the entrypoint script
RUN chmod u+x ./entrypoint

# Copy the build output and runtime dependencies
COPY --from=builder /usr/src/app/build ./
COPY --from=builder /usr/src/app/node_modules ./node_modules



# Expose ports for app and SSH
EXPOSE 5000 2222

# Run the entrypoint script
ENTRYPOINT ["./entrypoint"]
