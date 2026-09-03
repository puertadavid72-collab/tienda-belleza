const express = require('express');
const cors = require('cors');
const { sql, conectar } = require('./db');
const rateLimit = require('express-rate-limit');

const app = express();
const PUERTO = 3000;

app.use(cors());
app.use(express.json());

// Endpoint: obtener todos los productos (con filtro opcional por categoria)
app.get('/productos', async (req, res) => {
    try {
        const { categoria_id } = req.query;
        const pool = await conectar();

        let resultado;
        if (categoria_id) {
            resultado = await pool.request()
                .input('categoria_id', sql.Int, categoria_id)
                .query('SELECT * FROM Productos WHERE categoria_id = @categoria_id');
        } else {
            resultado = await pool.request().query('SELECT * FROM Productos');
        }

        res.json(resultado.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});




// Endpoint: obtener un producto por id
app.get('/productos/:id', async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Productos WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});



// Endpoint: obtener todas las categorias
app.get('/categorias', async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request().query('SELECT * FROM Categorias');
        res.json(resultado.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener las categorias' });
    }
});


// Endpoint: obtener todas las marcas
app.get('/marcas', async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request().query('SELECT * FROM Marcas');
        res.json(resultado.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener las marcas' });
    }
});


// Endpoint: obtener un producto con sus variantes (colores y stock)
app.get('/productos/:id/completo', async (req, res) => {
    try {
        const pool = await conectar();

        const producto = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Productos WHERE id = @id');

        if (producto.recordset.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const variantes = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT vp.id, vp.stock, c.nombre AS color, c.codigo_hex
                FROM Variantes_Producto vp
                JOIN Colores c ON vp.color_id = c.id
                WHERE vp.producto_id = @id
            `);

        const resultado = producto.recordset[0];
        resultado.variantes = variantes.recordset;

        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener el producto completo' });
    }
});


// Endpoint: obtener todos los colores
app.get('/colores', async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request().query('SELECT * FROM Colores');
        res.json(resultado.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los colores' });
    }
});


// Endpoint: crear un producto nuevo
app.post('/productos', verificarToken, async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria_id, marca_id } = req.body;

        if (!nombre || !precio || !categoria_id || !marca_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const pool = await conectar();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar(sql.MAX), descripcion || '')
            .input('precio', sql.Decimal(10, 2), precio)
            .input('categoria_id', sql.Int, categoria_id)
            .input('marca_id', sql.Int, marca_id)
            .query(`
                INSERT INTO Productos (nombre, descripcion, precio, categoria_id, marca_id)
                OUTPUT INSERTED.*
                VALUES (@nombre, @descripcion, @precio, @categoria_id, @marca_id)
            `);

        res.status(201).json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});


// Endpoint: actualizar un producto existente
app.put('/productos/:id', verificarToken, async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria_id, marca_id } = req.body;

        if (!nombre || !precio || !categoria_id || !marca_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar(sql.MAX), descripcion || '')
            .input('precio', sql.Decimal(10, 2), precio)
            .input('categoria_id', sql.Int, categoria_id)
            .input('marca_id', sql.Int, marca_id)
            .query(`
                UPDATE Productos
                SET nombre = @nombre,
                    descripcion = @descripcion,
                    precio = @precio,
                    categoria_id = @categoria_id,
                    marca_id = @marca_id
                OUTPUT INSERTED.*
                WHERE id = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});


// Endpoint: eliminar un producto
app.delete('/productos/:id', verificarToken, async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Productos OUTPUT DELETED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ mensaje: 'Producto eliminado', producto: resultado.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});



// --- CRUD Categorias ---

app.post('/categorias', verificarToken, async (req, res) => {
    try {
        const { nombre, imagen } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });

        const pool = await conectar();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('imagen', sql.VarChar, imagen || null)
            .query('INSERT INTO Categorias (nombre, imagen) OUTPUT INSERTED.* VALUES (@nombre, @imagen)');

        res.status(201).json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear la categoria' });
    }
});



app.put('/categorias/:id', verificarToken, async (req, res) => {
    try {
        const { nombre, imagen } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });

        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.VarChar, nombre)
            .input('imagen', sql.VarChar, imagen || null)
            .query('UPDATE Categorias SET nombre = @nombre, imagen = @imagen OUTPUT INSERTED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Categoria no encontrada' });
        }
        res.json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar la categoria' });
    }
});



app.delete('/categorias/:id', verificarToken, async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Categorias OUTPUT DELETED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Categoria no encontrada' });
        }
        res.json({ mensaje: 'Categoria eliminada', categoria: resultado.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar la categoria' });
    }
});

// --- CRUD Marcas ---

app.post('/marcas', verificarToken, async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });

        const pool = await conectar();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .query('INSERT INTO Marcas (nombre) OUTPUT INSERTED.* VALUES (@nombre)');

        res.status(201).json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear la marca' });
    }
});

app.put('/marcas/:id', verificarToken, async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });

        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.VarChar, nombre)
            .query('UPDATE Marcas SET nombre = @nombre OUTPUT INSERTED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }
        res.json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar la marca' });
    }
});

app.delete('/marcas/:id', verificarToken, async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Marcas OUTPUT DELETED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Marca no encontrada' });
        }
        res.json({ mensaje: 'Marca eliminada', marca: resultado.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar la marca' });
    }
});


// --- CRUD Colores ---

app.post('/colores', verificarToken, async (req, res) => {
    try {
        const { nombre, codigo_hex } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });

        const pool = await conectar();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('codigo_hex', sql.VarChar, codigo_hex || null)
            .query('INSERT INTO Colores (nombre, codigo_hex) OUTPUT INSERTED.* VALUES (@nombre, @codigo_hex)');

        res.status(201).json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear el color' });
    }
});

app.put('/colores/:id', verificarToken, async (req, res) => {
    try {
        const { nombre, codigo_hex } = req.body;
        if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });

        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.VarChar, nombre)
            .input('codigo_hex', sql.VarChar, codigo_hex || null)
            .query('UPDATE Colores SET nombre = @nombre, codigo_hex = @codigo_hex OUTPUT INSERTED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Color no encontrado' });
        }
        res.json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar el color' });
    }
});

app.delete('/colores/:id', verificarToken, async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Colores OUTPUT DELETED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Color no encontrado' });
        }
        res.json({ mensaje: 'Color eliminado', color: resultado.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar el color' });
    }
});


// --- CRUD Variantes_Producto ---

app.post('/variantes', verificarToken, async (req, res) => {
    try {
        const { producto_id, color_id, stock } = req.body;
        if (!producto_id || !color_id) {
            return res.status(400).json({ error: 'Faltan producto_id o color_id' });
        }

        const pool = await conectar();
        const resultado = await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('color_id', sql.Int, color_id)
            .input('stock', sql.Int, stock ?? 0)
            .query(`
                INSERT INTO Variantes_Producto (producto_id, color_id, stock)
                OUTPUT INSERTED.*
                VALUES (@producto_id, @color_id, @stock)
            `);

        res.status(201).json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear la variante' });
    }
});

app.put('/variantes/:id', verificarToken, async (req, res) => {
    try {
        const { stock } = req.body;
        if (stock === undefined) {
            return res.status(400).json({ error: 'Falta el campo stock' });
        }

        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('stock', sql.Int, stock)
            .query('UPDATE Variantes_Producto SET stock = @stock OUTPUT INSERTED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Variante no encontrada' });
        }
        res.json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar el stock' });
    }
});

app.delete('/variantes/:id', verificarToken, async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Variantes_Producto OUTPUT DELETED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Variante no encontrada' });
        }
        res.json({ mensaje: 'Variante eliminada', variante: resultado.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar la variante' });
    }
});


app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});

const multer = require('multer');
const cloudinary = require('./cloudinary');

const upload = multer({ storage: multer.memoryStorage() });

// Endpoint: subir una imagen para una variante de producto
app.post('/imagenes', verificarToken, upload.single('imagen'), async (req, res) => {
    try {
        const { variante_id } = req.body;
        if (!variante_id || !req.file) {
            return res.status(400).json({ error: 'Faltan variante_id o el archivo de imagen' });
        }

        const subida = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'tienda-belleza' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        const pool = await conectar();
        const resultado = await pool.request()
            .input('variante_id', sql.Int, variante_id)
            .input('url', sql.VarChar, subida.secure_url)
            .query('INSERT INTO Imagenes (variante_id, url) OUTPUT INSERTED.* VALUES (@variante_id, @url)');

        res.status(201).json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No se envió token de autenticación' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Formato de token inválido' });
    }

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = datos;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
}






// Endpoint: registrar un usuario admin (usar una sola vez)
app.post('/usuarios/registro', async (req, res) => {
    try {
        const { nombre, email, contrasena } = req.body;
        if (!nombre || !email || !contrasena) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const hash = await bcrypt.hash(contrasena, 10);

        const pool = await conectar();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('email', sql.VarChar, email)
            .input('contrasena', sql.VarChar, hash)
            .input('rol', sql.VarChar, 'admin')
            .query(`
                INSERT INTO Usuarios (nombre, email, contrasena, rol)
                OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.email, INSERTED.rol
                VALUES (@nombre, @email, @contrasena, @rol)
            `);

        res.status(201).json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

const limitadorLogin = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});





// Endpoint: login del admin
app.post('/usuarios/login', limitadorLogin, async (req, res) => {
    try {
        const { email, contrasena } = req.body;
        if (!email || !contrasena) {
            return res.status(400).json({ error: 'Faltan email o contraseña' });
        }

        const pool = await conectar();
        const resultado = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        if (resultado.recordset.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = resultado.recordset[0];
        const coincide = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!coincide) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al iniciar sesion' });
    }
});


// --- Carritos ---

// Endpoint: crear o recuperar un carrito por sesion_id
app.post('/carritos', async (req, res) => {
    try {
        const { sesion_id } = req.body;
        if (!sesion_id) {
            return res.status(400).json({ error: 'Falta sesion_id' });
        }

        const pool = await conectar();

        const existente = await pool.request()
            .input('sesion_id', sql.VarChar, sesion_id)
            .query('SELECT * FROM Carritos WHERE sesion_id = @sesion_id');

        if (existente.recordset.length > 0) {
            return res.json(existente.recordset[0]);
        }

        const nuevo = await pool.request()
            .input('sesion_id', sql.VarChar, sesion_id)
            .query('INSERT INTO Carritos (sesion_id) OUTPUT INSERTED.* VALUES (@sesion_id)');

        res.status(201).json(nuevo.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear el carrito' });
    }
});

// Endpoint: ver el contenido completo de un carrito
app.get('/carritos/:sesion_id', async (req, res) => {
    try {
        const pool = await conectar();

        const carrito = await pool.request()
            .input('sesion_id', sql.VarChar, req.params.sesion_id)
            .query('SELECT * FROM Carritos WHERE sesion_id = @sesion_id');

        if (carrito.recordset.length === 0) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        const items = await pool.request()
            .input('carrito_id', sql.Int, carrito.recordset[0].id)
            .query(`
                SELECT dc.id, dc.cantidad, dc.variante_id,
                       p.nombre AS producto, p.precio,
                       c.nombre AS color
                FROM Detalle_Carrito dc
                JOIN Variantes_Producto vp ON dc.variante_id = vp.id
                JOIN Productos p ON vp.producto_id = p.id
                JOIN Colores c ON vp.color_id = c.id
                WHERE dc.carrito_id = @carrito_id
            `);

        res.json({ carrito: carrito.recordset[0], items: items.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});


// --- Detalle_Carrito ---

// Endpoint: agregar un producto al carrito
app.post('/detalle-carrito', async (req, res) => {
    try {
        const { carrito_id, variante_id, cantidad } = req.body;
        if (!carrito_id || !variante_id) {
            return res.status(400).json({ error: 'Faltan carrito_id o variante_id' });
        }

        const pool = await conectar();

        const existente = await pool.request()
            .input('carrito_id', sql.Int, carrito_id)
            .input('variante_id', sql.Int, variante_id)
            .query('SELECT * FROM Detalle_Carrito WHERE carrito_id = @carrito_id AND variante_id = @variante_id');

        if (existente.recordset.length > 0) {
            const item = existente.recordset[0];
            const nuevaCantidad = item.cantidad + (cantidad || 1);
            const actualizado = await pool.request()
                .input('id', sql.Int, item.id)
                .input('cantidad', sql.Int, nuevaCantidad)
                .query('UPDATE Detalle_Carrito SET cantidad = @cantidad OUTPUT INSERTED.* WHERE id = @id');
            return res.json(actualizado.recordset[0]);
        }

        const nuevo = await pool.request()
            .input('carrito_id', sql.Int, carrito_id)
            .input('variante_id', sql.Int, variante_id)
            .input('cantidad', sql.Int, cantidad || 1)
            .query(`
                INSERT INTO Detalle_Carrito (carrito_id, variante_id, cantidad)
                OUTPUT INSERTED.*
                VALUES (@carrito_id, @variante_id, @cantidad)
            `);

        res.status(201).json(nuevo.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al agregar el producto al carrito' });
    }
});

// Endpoint: cambiar la cantidad de un item del carrito
app.put('/detalle-carrito/:id', async (req, res) => {
    try {
        const { cantidad } = req.body;
        if (!cantidad || cantidad < 1) {
            return res.status(400).json({ error: 'Cantidad inválida' });
        }

        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('cantidad', sql.Int, cantidad)
            .query('UPDATE Detalle_Carrito SET cantidad = @cantidad OUTPUT INSERTED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }
        res.json(resultado.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar la cantidad' });
    }
});

// Endpoint: quitar un producto del carrito
app.delete('/detalle-carrito/:id', async (req, res) => {
    try {
        const pool = await conectar();
        const resultado = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Detalle_Carrito OUTPUT DELETED.* WHERE id = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }
        res.json({ mensaje: 'Producto quitado del carrito', item: resultado.recordset[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al quitar el producto' });
    }
});