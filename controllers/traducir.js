// contiene las funciones / metodos relacionados con usuarios 
const { request, response, json } = require('express');

const { getConexionBD } = require('../models/database');

const deepl = require('deepl-node');

const authKey = "d5a71063-8029-25fb-e64c-94763b72b303:fx"; // Replace with your key
const translator = new deepl.Translator(authKey);



const traducirTexto = async (req = request, res = response) => {  
    const texto = req.query.texto;
    const idiomaOrigen = req.query.idiomaOrigen;
    const idiomaDestino = req.query.idiomaDestino;

    try {
        const traduccion = await translator.translateText(texto, idiomaOrigen, idiomaDestino);
        res.json({
            original: texto,
            traduccion: traduccion.text,
        });
    } catch (error) {
        console.log(error);
        res.json({});
    }
}

const traducirTemporada = async (req = request, res = response) => {
    // Procesa todos los articulos de una temporada, que tengan informado el texto en español
    // y hace la traducción para cada uno de los idiomas que no la tengan cumplimentada.
    // Una vez obtenida la traduccion de cada idioma, se actualiza la tabla de textos de
    // artículos (tblArticulosTexto) con la traducción correspondiente
    const temporada = req.params.temporada;

    if (temporada == null) res.json({});
    const cn = await getConexionBD();
    const datos = await cn
    .request()
    .input('temporada', temporada)
    .query('SELECT a.idArticulo, t.textoES, t.textoEN, t.textoFR, t.textoIT, t.textoPT, t.textoDE '
        +  '  FROM ( tblArticulos a ' 
        +  '  LEFT JOIN tblArticulosTexto t ON t.idArticulo = a.idArticulo ) ' 
        +  ' WHERE a.activo = 1 '
        +  '   AND a.temporada = @temporada '
        +  '   AND t.textoES IS NOT NULL ' 
    );
    if (datos.rowsAffected[0] == 0){
        res.json({});
    }
    else {        
        let respuesta = datos.recordset;
        let textoTraducido = '';
        let arr = ['en','fr','it','pt','de'];
        let i=0, j=0;
        for (let rs of respuesta) {
            textoOrigen = rs["textoES"];
            if (textoOrigen.length > 0) {
                for (let idioma of arr){
                    let idiomaDestino = idioma;
                    if (idioma == 'en') idiomaDestino = 'en-GB';
                    if (idioma == 'pt') idiomaDestino = 'pt-PT';
                    if ( rs["texto" + idioma.toUpperCase()] == '' ) {
                        let textoTraducido = await traducirA( textoOrigen, idiomaDestino );
                        await updateTraduccion( rs["idArticulo"], idioma, textoTraducido );
                        j++;
                    }
                }
            }
            i++;
        }
        res.json({
            'estado': 'OK',
            'procesados': i,
            'traducciones': j,
        });
    }
}


const traducirArticulo = async (req = request, res = response) => {
    const idArticulo = req.params.idArticulo;
    if (idArticulo == null) res.json({});
    const cn = await getConexionBD();
    const datos = await cn
    .request()
    .input('idArticulo', idArticulo)
    .query('SELECT t.textoES, t.textoEN, t.textoFR, t.textoIT, t.textoPT, t.textoDE '
        +  '  FROM tblArticulosTexto t ' 
        +  ' WHERE t.idArticulo = @idArticulo '
        +  '   AND t.textoES IS NOT NULL ' 
    );
    if (datos.rowsAffected[0] == 0){
        res.json({});
    }
    else {        
        let rs = datos.recordset[0];
        let textoOrigen = rs["textoES"];
        let arr = ['en','fr','it','pt','de'];
        if (textoOrigen.length > 0) {
            for (let idioma of arr){
                let idiomaDestino = idioma;
                if (idioma == 'en') idiomaDestino = 'en-GB';
                if (idioma == 'pt') idiomaDestino = 'pt-PT';
                if ( rs["texto" + idioma.toUpperCase()] == '' ) {
                    let textoTraducido = await traducirA( textoOrigen, idiomaDestino );
                    await updateTraduccion( idArticulo, idioma, textoTraducido );
                }    
            }
            res.json({
                'estado': 'OK',
                'procesados': 1,
            });    
        } 
        else {
            res.json({
                'estado': 'OK',
                'mensaje': 'Articulo sin descripcion',
                'procesados': 0,
            });    
        }
    }
}


const updateTraduccion = async (idArticulo, idioma, texto) => {
    if (texto.length > 0) {
        const campo = 'texto' + idioma.toUpperCase();
        console.log(idArticulo, campo);
        const cn = await getConexionBD();
        const datos = await cn
        .request()
        .input('texto', texto)
        .input('idArticulo', idArticulo)
        .query('UPDATE tblArticulosTexto ' 
            +  '   SET ' + campo + '= @texto '
            +  ' WHERE idArticulo = @idArticulo '
        );    
    }
}

const traducirA = async (texto, idiomaDestino) => {
    try {
        const traduccion = await translator.translateText(texto, 'es', idiomaDestino);
        return traduccion.text;
    } catch (error) {
        console.log(error);
        return '';
    }
}





module.exports = { 
    traducirTexto,
    traducirTemporada,
    traducirArticulo,
}