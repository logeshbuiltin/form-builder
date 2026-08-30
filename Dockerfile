FROM improwised/docker-nodejs-base:23.4.0-latest

# Clean any previous builds to ensure fresh deployment
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app
ADD ./dist/form-builder/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY svc-nginx /etc/s6-overlay/s6-rc.d/svc-nginx
COPY svc-env /etc/s6-overlay/s6-rc.d/svc-env

# Remove unnecessary Node.js app service (this is static content only)
RUN rm /etc/s6-overlay/s6-rc.d/user/contents.d/svc-node-app && \
    rm -r /etc/s6-overlay/s6-rc.d/svc-node-app && \
    touch /etc/s6-overlay/s6-rc.d/user/contents.d/svc-env

# Copy environment configuration template
COPY ./projects/form-builder/src/assets/env.js.template env.js.template

# Set permissions
RUN chmod +x /etc/s6-overlay/s6-rc.d/svc-env/run

# Health check to verify nginx is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

ENTRYPOINT ["/init"]
