import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto'; // <-- Importamos la librería de encriptación

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            // 1. Para el Widget necesitamos una "Llave de Integridad" (ya te explico dónde sacarla)
            const llaveIntegridad = process.env.BOLD_INTEGRITY_KEY_TEST?.trim() || 'kUG4jbG1kR8_guZLGpW09Q';

            const referencia = `BP-RES-${reservaId}-${Date.now()}`;
            const moneda = 'COP';
            const montoFijo = Number(monto);

            // 2. Bold exige que firmemos los datos para que nadie los pueda alterar
            const stringToHash = `${referencia}${montoFijo}${moneda}${llaveIntegridad}`;
            const hashCriptografico = crypto.createHash('sha256').update(stringToHash).digest('hex');

            // 3. Guardamos la reserva como PENDIENTE en tu base de datos
            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reservaId,
                    monto: montoFijo,
                    estado: 'PENDIENTE',
                    boldLinkId: referencia, // Usamos la referencia como ID
                    urlPasarela: 'WIDGET',
                }
            });

            // 4. Devolvemos los datos para que el Frontend abra el Widget
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
                alerta: 'Error al encriptar los datos',
                detalles_bold: error.message
            });
        }
    }
}