// Pone caché de un año a las fotos que ya están en Supabase.
//
// Las fotos subidas desde el editor quedaron con "no-cache", así que el navegador
// las vuelve a pedir en cada visita. Cada foto tiene un nombre único (si se cambia
// una foto, la nueva queda con otro nombre), por eso es seguro guardarlas un año.
//
// Uso, desde la carpeta del backend:
//   node scripts/cache-fotos.js            -> solo revisa y cuenta, no cambia nada
//   node scripts/cache-fotos.js --aplicar  -> actualiza las que falten
//
// Se puede correr las veces que sea: las que ya quedaron bien se saltan.
require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'fotos-propiedades';
const CACHE_SEGUNDOS = '31536000'; // un año
const OBJETIVO = `max-age=${CACHE_SEGUNDOS}`;
const APLICAR = process.argv.includes('--aplicar');
const EN_PARALELO = 4;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\nFaltan variables de entorno.');
    console.error('Agrega estas dos lineas a tu archivo .env del backend:\n');
    console.error('  SUPABASE_URL=https://xxxxx.supabase.co');
    console.error('  SUPABASE_SERVICE_KEY=tu_clave_secreta\n');
    process.exit(1);
}

const storage = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY).storage.from(BUCKET);

// Recorre el bucket completo, carpeta por carpeta, de 100 en 100
async function listarTodo(prefijo = '') {
    const archivos = [];
    for (let offset = 0; ; offset += 100) {
        const { data, error } = await storage.list(prefijo, {
            limit: 100,
            offset,
            sortBy: { column: 'name', order: 'asc' },
        });
        if (error) throw new Error(`No se pudo listar "${prefijo || '/'}": ${error.message}`);

        for (const item of data) {
            const ruta = prefijo ? `${prefijo}/${item.name}` : item.name;
            if (item.id === null) {
                archivos.push(...(await listarTodo(ruta))); // es una carpeta
            } else if (!item.name.startsWith('.emptyFolderPlaceholder')) {
                archivos.push({ ruta, meta: item.metadata || {} });
            }
        }
        if (data.length < 100) break;
    }
    return archivos;
}

// Descarga la foto y la vuelve a subir en el mismo lugar (misma URL) con la caché nueva
async function ponerCache({ ruta, meta }) {
    const { data: blob, error } = await storage.download(ruta);
    if (error) throw new Error(`no se pudo descargar: ${error.message}`);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const esperado = Number(meta.size ?? meta.contentLength);
    if (buffer.length === 0) throw new Error('la foto llegó vacía, no se tocó');
    if (Number.isFinite(esperado) && esperado > 0 && buffer.length !== esperado) {
        throw new Error(`la descarga llegó incompleta (${buffer.length} de ${esperado} bytes), no se tocó`);
    }

    const { error: errorSubida } = await storage.upload(ruta, buffer, {
        upsert: true,
        cacheControl: CACHE_SEGUNDOS,
        contentType: meta.mimetype || blob.type || 'application/octet-stream',
    });
    if (errorSubida) throw new Error(`no se pudo subir: ${errorSubida.message}`);
}

async function main() {
    console.log(`\nRevisando las fotos del bucket "${BUCKET}"...`);
    const archivos = await listarTodo();
    const pendientes = archivos.filter((a) => (a.meta.cacheControl || '') !== OBJETIVO);

    const conteo = {};
    for (const a of archivos) {
        const actual = a.meta.cacheControl || '(sin dato)';
        conteo[actual] = (conteo[actual] || 0) + 1;
    }
    console.log(`Archivos encontrados: ${archivos.length}`);
    for (const [actual, cuantos] of Object.entries(conteo)) {
        console.log(`  ${actual}: ${cuantos}`);
    }
    console.log(`Por actualizar: ${pendientes.length}\n`);

    if (!APLICAR) {
        console.log('Modo revisión: no se cambió nada.');
        console.log('Para aplicarlo:  node scripts/cache-fotos.js --aplicar\n');
        return;
    }
    if (pendientes.length === 0) {
        console.log('Todas las fotos ya tienen la caché de un año.\n');
        return;
    }

    let hechas = 0;
    const fallas = [];
    let siguiente = 0;

    async function trabajador() {
        while (siguiente < pendientes.length) {
            const archivo = pendientes[siguiente++];
            try {
                await ponerCache(archivo);
                hechas++;
                console.log(`  ok [${hechas + fallas.length}/${pendientes.length}] ${archivo.ruta}`);
            } catch (e) {
                fallas.push(archivo.ruta);
                console.log(`  x  [${hechas + fallas.length}/${pendientes.length}] ${archivo.ruta}: ${e.message}`);
            }
        }
    }
    await Promise.all(Array.from({ length: EN_PARALELO }, trabajador));

    console.log('\n-------------------------------------');
    console.log(`Actualizadas: ${hechas}`);
    console.log(`Con error:    ${fallas.length}`);
    if (fallas.length) {
        console.log('\nVuelve a correr el mismo comando: solo intentará las que faltan.');
        process.exitCode = 1;
    }
    console.log('');
}

main().catch((e) => {
    console.error('\nEl script se detuvo por un error:');
    console.error(e.message || e);
    process.exit(1);
});