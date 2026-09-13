import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            // 1. LLAVE HARDCODEADA TEMPORALMENTE: Para descartar fallos de caché en Render
            // En pagos.service.ts, asegúrate de que esté leyendo la variable de entorno:
            // 👇 Llave Secreta de PRODUCCIÓN quemada directo aquí
            const llaveSecreta = 'ei90AXR1UrlH1-wyy60zPw';

            const referencia = `BP-${Date.now()}`;
            const moneda = 'COP';
            const montoFijo = Math.round(Number(monto));

            // 3. Generamos el hash estricto
            const stringToHash = `${referencia}${montoFijo}${moneda}${llaveSecreta}`;
            const hashCriptografico = crypto.createHash('sha256').update(stringToHash, 'utf-8').digest('hex');

            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reservaId,
                    monto: montoFijo,
                    estado: 'PENDIENTE',
                    boldLinkId: referencia,
                    urlPasarela: 'WIDGET',
                }
            });

            return {
                success: true,
                pagoId: pago.id,
                referencia: referencia,
                hash: hashCriptografico,
                monto: montoFijo
            };

        } catch (error) {
            console.error('Error generando firma para Bold:', error);
            throw new InternalServerErrorException({
                alerta: 'Error al encriptar',
                detalles_bold: error.message
            });
        }
    }
}