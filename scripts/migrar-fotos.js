require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'fotos-propiedades';
const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\nFaltan variables de entorno.');
    console.error('Agrega estas dos lineas a tu archivo .env del backend:\n');
    console.error('  SUPABASE_URL=https://xxxxx.supabase.co');
    console.error('  SUPABASE_SERVICE_KEY=tu_clave_secreta\n');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrarUnaFoto(propiedadId, indice, foto) {
    if (!foto.startsWith('data:')) {
        return { url: foto, migrada: false };
    }

    const match = foto.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
        console.warn(`    ! foto ${indice}: formato no reconocido, se deja igual`);
        return { url: foto, migrada: false };
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const extension = mime.split('/')[1].replace('jpeg', 'jpg');
    const ruta = `${propiedadId}/${indice}.${extension}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(ruta, buffer, { contentType: mime, upsert: true });

    if (error) {
        console.error(`    x foto ${indice}: ${error.message}`);
        return { url: foto, migrada: false };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
    return { url: data.publicUrl, migrada: true };
}

async function main() {
    const propiedades = await prisma.propiedad.findMany({
        select: { id: true, titulo: true, fotos: true },
    });

    console.log(`\nEncontradas ${propiedades.length} propiedades.\n`);

    let totalMigradas = 0;
    let propiedadesTocadas = 0;

    for (const prop of propiedades) {
        const nombre = prop.titulo || prop.id;

        if (!prop.fotos || prop.fotos.length === 0) {
            console.log(`- ${nombre}: sin fotos`);
            continue;
        }

        console.log(`> ${nombre} (${prop.fotos.length} fotos)`);

        const nuevasUrls = [];
        let migradasAqui = 0;

        for (let i = 0; i < prop.fotos.length; i++) {
            const resultado = await migrarUnaFoto(prop.id, i, prop.fotos[i]);
            nuevasUrls.push(resultado.url);
            if (resultado.migrada) migradasAqui++;
        }

        if (migradasAqui > 0) {
            await prisma.propiedad.update({
                where: { id: prop.id },
                data: { fotos: nuevasUrls },
            });
            propiedadesTocadas++;
            totalMigradas += migradasAqui;
            console.log(`  OK: ${migradasAqui} fotos migradas\n`);
        } else {
            console.log('  (nada que migrar)\n');
        }
    }

    console.log('-------------------------------------');
    console.log(`Propiedades actualizadas: ${propiedadesTocadas}`);
    console.log(`Fotos migradas en total:  ${totalMigradas}\n`);
}

main()
    .catch((e) => {
        console.error('\nLa migracion se detuvo por un error:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });