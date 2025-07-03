FROM node:22 AS build

COPY . /app
WORKDIR /app

RUN corepack enable
RUN yarn install
RUN yarn build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
RUN mkdir -p /etc/nginx/conf.d && \
    cat > /etc/nginx/conf.d/default.conf <<EOF
server {
  listen 80;
  server_name localhost;

  location / {
    root /usr/share/nginx/html;
    try_files \$uri \$uri/ /index.html;
  }
}
EOF

EXPOSE 80