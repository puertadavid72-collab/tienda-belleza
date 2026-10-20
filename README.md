# Tienda de Belleza — API REST (Backend)

API REST de una plataforma de comercio electrónico para una tienda de belleza real, desarrollada como proyecto independiente. Gestiona el catálogo, el carrito de compras y el panel administrativo, con base de datos relacional en SQL Server y datos reales de inventario.

🔗 **Frontend (Angular):** [tienda-belleza-frontend](https://github.com/puertadavid72-collab/tienda-belleza-frontend)

## Tecnologías

- **Backend:** Node.js, Express
- **Base de datos:** SQL Server
- **Autenticación:** JWT + contraseñas cifradas con bcrypt
- **Almacenamiento de imágenes:** Cloudinary
- **Seguridad:** límite de intentos de inicio de sesión (express-rate-limit) y rutas de escritura protegidas con verificación de token
- **Frontend (repositorio aparte):** Angular con Server-Side Rendering

## Funcionalidades principales

- CRUD completo de Productos (con filtro por categoría), Categorías, Marcas, Colores y Variantes de producto
- Carrito de compras por sesión, sin necesidad de crear cuenta
- Login de administrador con JWT; las rutas de creación, edición y borrado requieren token
- Catálogo con más de 370 productos y 400 variantes, cargados desde un inventario real en Excel
- Subida de imágenes de producto a Cloudinary

## Cómo ejecutarlo

1. Tener SQL Server con la base de datos `TiendaBelleza`.
2. Instalar dependencias: `npm install`
3. Crear un archivo `.env` en la raíz con las variables `DB_SERVER`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` y las credenciales de Cloudinary. Este archivo no se sube al repositorio.
4. Iniciar el servidor: `node server.js`
5. La API queda disponible en `http://localhost:3000`.

## Estado actual

- Backend: completo, con pruebas funcionales en todos los endpoints.
- Frontend en Angular: conectado a la API (catálogo, carrito y panel administrativo).
- Pendiente: despliegue en producción, gestión de variantes y stock por color desde el panel, y pasarela de pagos.

## Autor

Diego David Muñetón Puerta — Estudiante de Tecnología en Desarrollo de Software, Politécnico Internacional.
