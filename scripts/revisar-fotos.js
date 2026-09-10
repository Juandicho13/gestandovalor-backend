require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.propiedad
    .findMany({ select: { titulo: true, fotos: true } })
    .then((props) => {
        let totalUrls = 0, totalB64 = 0;
        props.forEach((p) => {
            const fotos = p.fotos || [];
            if (fotos.length === 0) return;
            const urls = fotos.filter((f) => f.startsWith('http')).length;
            const b64 = fotos.filter((f) => f.startsWith('data:')).length;
            totalUrls += urls;
            totalB64 += b64;
            console.log(`${p.titulo}: ${fotos.length} fotos -> ${urls} URL, ${b64} base64`);
            fotos.forEach((f, i) => {
                if (f.startsWith('data:')) {
                    console.log(`   base64 #${i}: empieza con "${f.substring(0, 40)}" y pesa ${Math.round(f.length / 1024)} KB`);
                }
            });
        });
        console.log(`\nTOTAL: ${totalUrls} URLs, ${totalB64} base64 pendientes`);
    })
    .finally(() => prisma.$disconnect());