const express = require('express');
var session = require('express-session');
var https = require('https');
const cors = require('cors');
const fs = require('fs'); // para los certificados

var sess;

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.traducirPath = '/traducir'; 
        this.app.use(session({secret: 'nanos_EFENET', saveUninitialized: true, resave: true}));

        // Middlewares
        this.middlewares();

        // Rutas de la aplicacion
        this.rutas();
    }

    middlewares(){
        // CORS
        this.app.use ( cors() );

        // Envío de información al servidor -> POST, PUT, etc
        // leer y pasear el body. 
        this.app.use( express.json() );

        // para enviar datos mediante POST de un formulario sin problemas
        this.app.use( express.urlencoded({ extended: false }) );

        // HTML con info de acceso denegado si se entra en una pagina no API
        this.app.use( express.static('public') );
    }
    
    rutas() {
        this.app.use(this.traducirPath, require('../routes/traducir'));
    }

    escuchar() {
        /*
        this.app.listen(this.port, () => {
            console.log('Servidor en ', this.port);
        });
        */
        https.createServer({
                cert: fs.readFileSync('public-nanos.cer'),
                key: fs.readFileSync('private-nanos.key')
            }, this.app
        ).listen(this.port, () => {
            console.log('Servidor escuchando en', this.port);
        });
    }

}

module.exports = Server;
