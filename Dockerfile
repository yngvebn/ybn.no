FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY og.png /usr/share/nginx/html/og.png
RUN chmod 0644 /etc/nginx/conf.d/default.conf /usr/share/nginx/html/index.html /usr/share/nginx/html/og.png

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
