import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            const apiKey = process.env.BOLD_SECRET_KEY_TEST?.trim() || '';

            // 1. Petición a la URL oficial y correcta de Bold v2
            const response = await axios.post(
                'https://payments.api.bold.co/v2/payment-links', // <-- LA RUTA CORRECTA
                {
                    amount: {
                        currency: 'COP',
                        total_amount: Number(monto)
                    },
                    reference: `BP-RES-${reservaId}-${Date.now()}`,
                    description: descripcion.substring(0, 95),
                },
                {
                    headers: {
                        'Authorization': `Api-Key ${apiKey}`, // <-- FORMATO CORRECTO
                        'Content-Type': 'application/json',
                    }
                }
            );

            // 2. Extraemos la info (Bold devuelve payment_link directo en la data)
            const dataBold = response.data;

            // 3. Guardamos en tu base de datos de Prisma
            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reservaId,
                    monto: Number(monto),
                    estado: 'PENDIENTE',
                    boldLinkId: dataBold.id || 'ID_GENERADO',
                    urlPasarela: dataBold.payment_link || dataBold.url || '',
                }
            });

            return {
                success: true,
                pagoId: pago.id,
                linkPago: pago.urlPasarela
            };

        } catch (error) {
            // Si Bold se queja, nos dirá por qué exactamente
            const errorRealDeBold = error.response?.data || error.message;
            console.error('Error detallado con Bold:', errorRealDeBold);

            throw new InternalServerErrorException({
                alerta: 'Rechazo directo de Bold',
                detalles_bold: errorRealDeBold
            });
        }
    }
}