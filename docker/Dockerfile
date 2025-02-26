# Use the official Node.js 14 image.
# https://hub.docker.com/_/node
FROM node:14.16.0

# Create and change to the app directory.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . .

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package.json package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Select npm run as our entrypoint
ENTRYPOINT [ "npm", "run" ]

# Run the web service on container startup.
CMD [ "docker:dev" ]
