# Life Insurance Application Deployment

This directory contains all the necessary files for deploying the Life Insurance application using Docker on separate machines for the application and the database.

## Prerequisites

- Docker
- Docker Compose
- Acceso SSH y permisos de sudo en ambas máquinas

## Arquitectura

- **App Server (Máquina X):** Ejecuta la aplicación Node.js
- **DB Server (Máquina Y):** Ejecuta la base de datos PostgreSQL

## Deployment Steps

### 1. Database Server Setup (Máquina Y)

1. Instala Docker y Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. Copia los archivos `docker-compose.db.yml` y `.env.db.example` a la máquina de base de datos.

3. Crea el archivo de entorno:
   ```bash
   cp .env.db.example .env.db
   # Edita .env.db con tu configuración (usuario, contraseña, nombre de base de datos)
   ```

4. Inicia la base de datos:
   ```bash
   docker-compose -f docker-compose.db.yml up -d
   ```

5. Verifica la IP de la base de datos:
   ```bash
   hostname -I
   # O usa ifconfig/ip addr para obtener la IP de la máquina
   ```

### 2. Application Server Setup (Máquina X)

1. Instala Docker y Docker Compose (igual que arriba).

2. Copia los archivos `Dockerfile`, `docker-compose.app.yml`, y `.env.app.example` a la máquina de la aplicación.

3. Crea la red Docker (opcional, solo si usas varios contenedores en la misma máquina):
   ```bash
   docker network create app-network || true
   ```

4. Crea el archivo de entorno:
   ```bash
   cp .env.app.example .env.app
   # Edita .env.app y configura las variables de conexión a la base de datos:
   # DB_HOST=<IP_o_URL_de_tu_DB_Server>
   # DB_PORT=5432
   # DB_USER=postgres
   # DB_PASSWORD=tu_password
   # DB_NAME=life_insurance
   ```
   Ejemplo:
   ```env
   DB_HOST=192.168.1.100
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=supersecure
   DB_NAME=life_insurance
   ```

5. Inicia la aplicación:
   ```bash
   docker-compose -f docker-compose.app.yml up -d
   ```

## Notas Importantes

- Asegúrate de que el puerto 5432 de la base de datos esté accesible desde la máquina de la aplicación (puede requerir abrir el firewall o configurar el archivo `pg_hba.conf` de PostgreSQL).
- No uses `localhost` o `db` como host de la base de datos en `.env.app` si la base de datos está en otra máquina. Usa la IP o el dominio de la máquina de base de datos.
- Si usas Docker en ambas máquinas pero en hosts diferentes, la red Docker no es compartida entre máquinas, por eso debes usar la IP real.

## Verificación

1. Verifica que ambos contenedores estén corriendo:
   ```bash
   docker ps
   ```

2. Prueba la conexión desde la app a la base de datos:
   - Revisa los logs del contenedor de la app:
     ```bash
     docker logs life-insurance-app
     ```
   - Si hay errores de conexión, revisa la IP, usuario, contraseña y reglas de red.

3. Prueba el endpoint de la app:
   ```bash
   curl http://<IP_APP_SERVER>:3000/health
   ```

## Limpieza

1. Detén y elimina los contenedores:
   ```bash
   docker-compose -f docker-compose.app.yml down
   docker-compose -f docker-compose.db.yml down
   ```

2. Elimina los volúmenes si es necesario:
   ```bash
   docker volume rm life-insurance-postgres-data
   ```

## Seguridad

- Cambia todas las contraseñas por defecto en los archivos `.env`
- Usa contraseñas fuertes para la base de datos y JWT
- Configura el firewall para exponer solo los puertos necesarios
- Usa HTTPS en producción
- Actualiza regularmente las imágenes de Docker y dependencias 