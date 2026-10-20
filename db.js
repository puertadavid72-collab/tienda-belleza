require('dotenv').config();
const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        // En producción (base de datos remota) usar DB_ENCRYPT=true y DB_TRUST_CERT=false.
        // Sin estas variables se mantiene la configuración local de siempre.
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT !== 'false'
    }
};

async function conectar() {
    try {
        const pool = await sql.connect(config);
        console.log('Conexión exitosa a SQL Server');
        return pool;
    } catch (err) {
        console.error('Error de conexión:', err);
    }
}

module.exports = { sql, conectar };