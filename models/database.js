var sql = require("mssql");

var sqlConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: (process.env.DB_ENCRYPT == 'si') ? true : false, // true for azure
        trustServerCertificate: (process.env.DB_TRUST_CERT == 'si') ? true : false 
        // change to true for local dev / self-signed certs
    }
};


async function getConexionBD() {
    try {
        const cn = await sql.connect(sqlConfig); 
        return cn;
    }
    catch (err) {
        console.error(err);
    }
}

module.exports = { 
    getConexionBD
}