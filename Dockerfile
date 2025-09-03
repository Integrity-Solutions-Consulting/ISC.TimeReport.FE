FROM node:18-alpine AS builder
WORKDIR /app

RUN npm install -g @angular/cli@18

ARG URL_BASE
ARG URL_INV

COPY package*.json ./
RUN npm install

COPY . .

# Reemplaza las URLs de producción
RUN sed -i "s|URL_BASE_PLACEHOLDER|$URL_BASE|g" src/environments/environment.prod.ts && \
    sed -i "s|URL_INV_PLACEHOLDER|$URL_INV|g" src/environments/environment.prod.ts

RUN ng build --configuration=production

FROM nginx:alpine
COPY --from=builder /app/dist/isc.time-report.fe/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
