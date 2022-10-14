// contiene las RUTAS de los endpoints relacionados con usuarios

const { Router } = require('express');
const { 
    traducirTexto,
    traducirTemporada,
    traducirArticulo,
    } = require('../controllers/traducir');

const router = Router();


router.get('/', traducirTexto);

router.get('/temporada/:temporada', traducirTemporada);

router.get('/articulo/:idArticulo', traducirArticulo);
 

module.exports = router;