```mermaid
graph TB
    subgraph "Máquina X (App Server)"
        A[Preparar Máquina] --> B[Instalar Docker]
        B --> C[Instalar Docker Compose]
        C --> D[Crear Red Docker]
        D --> E[app-network]
        E --> F[Configurar .env.app]
        F --> G[Iniciar Contenedor App]
        G --> H[life-insurance-app]
    end

    subgraph "Máquina Y (DB Server)"
        I[Preparar Máquina] --> J[Instalar Docker]
        J --> K[Instalar Docker Compose]
        K --> L[Configurar .env.db]
        L --> M[Iniciar Contenedor DB]
        M --> N[life-insurance-db]
    end

    subgraph "Red Docker"
        E --> O[Comunicación entre contenedores]
        H --> O
        N --> O
    end

    style H fill:#bbf,stroke:#333,stroke-width:2px
    style N fill:#bfb,stroke:#333,stroke-width:2px
    style E fill:#fbb,stroke:#333,stroke-width:2px
```

## Explicación del Flujo

1. **Máquina X (App Server)**
   - Instalar Docker y Docker Compose
   - Crear la red Docker `app-network`
   - Configurar variables de entorno en `.env.app`
   - Desplegar el contenedor de la aplicación

2. **Máquina Y (DB Server)**
   - Instalar Docker y Docker Compose
   - Configurar variables de entorno en `.env.db`
   - Desplegar el contenedor de la base de datos

3. **Comunicación**
   - Ambos contenedores están en la misma red Docker
   - La aplicación se conecta a la base de datos usando el hostname `db`
   - La red Docker maneja la resolución de nombres automáticamente

## Archivos y Configuración

```mermaid
graph LR
    A[docker-compose.app.yml] --> B[.env.app]
    C[docker-compose.db.yml] --> D[.env.db]
    
    A --> E[Dockerfile]
    C --> F[Postgres Image]
```

## Estructura de Red

```mermaid
graph TB
    subgraph "Red Docker: app-network"
        A[life-insurance-app] -->|"db:5432"| B[life-insurance-db]
        B -->|"healthcheck"| C[pg_isready]
        A -->|"healthcheck"| D[curl /health]
    end
``` 