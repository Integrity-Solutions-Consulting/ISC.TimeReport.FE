# Etapa 1: Build del frontend
FROM node:18-alpine AS builder
WORKDIR /app

# Instala Angular CLI globalmente
RUN npm install -g @angular/cli@18

# Argumentos para URLs de producción
ARG URL_BASE
ARG URL_INV

# Copia las dependencias
COPY package*.json ./
RUN npm install

# Copia todo el proyecto
COPY . .

# Reemplaza las URLs de producción solo si existe el archivo
RUN if [ -f src/environments/environment.prod.ts ]; then \
        echo "Archivo encontrado, reemplazando URLs"; \
        sed -i "s|URL_BASE_PLACEHOLDER|$URL_BASE|g" src/environments/environment.prod.ts && \
        sed -i "s|URL_INV_PLACEHOLDER|$URL_INV|g" src/environments/environment.prod.ts; \
    else \
        echo "ERROR: environment.prod.ts NO encontrado"; exit 1; \
    fi

# Build de Angular

RUN ng build --configuration production

# Etapa 2: Servir con Nginx
FROM nginx:alpine
# Ajusta esta ruta según el nombre exacto de tu proyecto Angular
COPY --from=builder /app/dist/isc.time-report.fe/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]

