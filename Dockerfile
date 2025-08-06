# Stage 1: Build Angular App
FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g @angular/cli@18

COPY package*.json ./
RUN npm install

COPY . .

RUN ng build --configuration=production

FROM nginx:alpine

COPY --from=builder /app/dist/isc.time-report.fe/browser /usr/share/nginx/html
COPY  nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
