import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            // 1. Usamos tu LLAVE SECRETA (La que vimos en tu captura de pantalla)
            const llaveSecreta = process.env.BOLD_SECRET_KEY_TEST?.trim() || 'kUG4jbG1kR8_guZLGpW09Q';

            const referencia = `BP-RES-${reservaId}-${Date.now()}`;
            const moneda = 'COP';
            const montoFijo = Math.round(Number(monto)); // Sin decimales para que no falle

            // 2. Bold exige este orden estricto: {Referencia}{Monto}{Moneda}{LlaveSecreta}
            const stringToHash = `${referencia}${montoFijo}${moneda}${llaveSecreta}`;

            // 3. Generamos el hash criptográfico
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