# Dockerfile.simple - usa build já realizado localmente
FROM nginx:alpine

# Copiar a pasta dist já buildada localmente
COPY dist /usr/share/nginx/html

# Copiar configuração nginx customizada (opcional)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]