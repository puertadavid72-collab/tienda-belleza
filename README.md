# Tienda de Belleza — API + Panel Administrativo

Plataforma de comercio electrónico para una tienda de belleza, desarrollada como proyecto independiente. Incluye una API REST completa, base de datos relacional, panel administrativo con autenticación y un catálogo público construido con datos reales de inventario.

## Tecnologías

- **Backend:** Node.js, Express
- **Base de datos:** SQL Server
- **Autenticación:** JWT + contraseñas cifradas con bcrypt
- **Frontend:** Angular (con Server-Side Rendering e hidratación)
- **Almacenamiento de imágenes:** Cloudinary
- **Seguridad:** rate limiting en login (express-rate-limit), rutas de escritura protegidas con verificación de token

## Funcionalidades principales

- CRUD completo de Productos (con filtro por categoría), Categorías, Marcas, Colores y Variantes de producto
- Carrito de compras funcional por sesión (sin necesidad de cuenta) y por usuario
- Panel administrativo protegido con login JWT: gestión de categorías, marcas y productos
- Catálogo público con más de 370 productos y 400 variantes, cargados desde un inventario real en Excel
- Subida de imágenes de producto a Cloudinary desde el backend
- Roles de usuario diferenciados: cliente (sin necesidad de cuenta) y administrador

## Estructura del proyecto

- `tienda-belleza-api/` — Backend en Node.js + Express, conectado a SQL Server
- Frontend en Angular — catálogo público y panel administrativo

## Estado actual

- Backend: completo, con pruebas funcionales en todos los endpoints
- Integración con el frontend en Angular: en curso (catálogo y panel de productos/categorías/marcas ya conectados)
- Pendiente: gestión de variantes/stock por color desde el panel admin, pasarela de pagos

## Autor

Diego David Muñetón Puerta — Estudiante de Tecnología en Desarrollo de Software, Politécnico Internacional