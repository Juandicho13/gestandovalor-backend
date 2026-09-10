import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async createEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            const apiKey = process.env.BOLD_SECRET_KEY_TEST;

            const response = await axios.post(
                'https://integrations.api.bold.co/online/link/v1',
                {
                    amount_type: 'CLOSE',
                    amount: {
                        currency: 'COP',
                        total_amount: monto
                    },
                    reference: `BP-RES-${reservaId}-${Date.now()}`,
                    description: descripcion,
                },
                {
                    headers: {
                        'Authorization': `Api-Key ${apiKey}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            // Bold envuelve la respuesta en "payload"
            const dataBold = response.data.payload || response.data;

            // Guardamos en tu base de datos de Prisma
            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reservaId,
                    monto: monto,
                    estado: 'PENDIENTE',
                    boldLinkId: dataBold.payment_link || dataBold.id,
                    urlPasarela: dataBold.url || dataBold.pay_link,
                }
            });

            return {
                success: true,
                pagoId: pago.id,
                linkPago: pago.urlPasarela
            };

        } catch (error) {
            console.error('🔥 Error con Bold:', error.response?.data || error.message);
            throw new InternalServerErrorException('Error al generar el enlace de pago.');
        }
    }
}