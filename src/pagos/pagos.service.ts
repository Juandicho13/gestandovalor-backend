import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string) {
        // Las llaves se leen de Render > Environment.
        // trim() elimina espacios o saltos de línea que se cuelan al pegar.
        const llaveSecreta = (process.env.BOLD_PRIVATE_KEY || '').trim();
        const llaveIdentidad = (process.env.BOLD_PUBLIC_KEY || '').trim();

        if (!llaveSecreta || !llaveIdentidad) {
            console.error('Bold: faltan BOLD_PRIVATE_KEY o BOLD_PUBLIC_KEY en las variables de entorno');
            throw new InternalServerErrorException('La pasarela de pagos no está configurada');
        }

        // El monto se toma de la reserva guardada, no de lo que mande el navegador
        const reserva = await this.prisma.reserva.findUnique({
            where: { id: reservaId },
        });

        if (!reserva) {
            throw new NotFoundException('La reserva no existe');
        }

        const referencia = `BP-${Date.now()}`;
        const moneda = 'COP';
        const montoFijo = Math.round(Number(reserva.monto_total));

        // Hash de integridad: {orderId}{amount}{currency}{llaveSecreta}
        const cadena = `${referencia}${montoFijo}${moneda}${llaveSecreta}`;
        const hash = crypto.createHash('sha256').update(cadena, 'utf8').digest('hex');

        try {
            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reserva.id,
                    monto: montoFijo,
                    moneda: moneda,
                    estado: 'PENDIENTE',
                    boldLinkId: referencia,
                    urlPasarela: 'WIDGET',
                },
            });

            return {
                success: true,
                pagoId: pago.id,
                referencia: referencia,
                hash: hash,
                monto: montoFijo,
                moneda: moneda,
                apiKey: llaveIdentidad, // La llave de identidad es pública, se puede enviar al navegador
            };
        } catch (error) {
            console.error('Bold: error registrando el pago:', error);
            throw new InternalServerErrorException('No se pudo registrar el pago');
        }
    }
}