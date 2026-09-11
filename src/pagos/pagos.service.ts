import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            const apiKey = process.env.BOLD_SECRET_KEY_TEST?.trim() || '';

            const response = await axios.post(
                'https://payments.api.bold.co/v2/payment-links', // URL Oficial de Producción
                {
                    amount: {
                        currency: 'COP',
                        total_amount: Number(monto)
                    },
                    reference: `BP-RES-${reservaId}-${Date.now()}`,
                    description: descripcion.substring(0, 95),
                    // 👇 AQUÍ LE DECIMOS A BOLD A DÓNDE REGRESAR AL CLIENTE
                    redirection_url: 'https://gestandovalor.com' // Luego puedes cambiar esto a tu página de "reserva exitosa"
                },
                {
                    headers: {
                        'Authorization': `Api-Key ${apiKey}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            const dataBold = response.data;

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
            const errorRealDeBold = error.response?.data || error.message;
            console.error('Error detallado con Bold:', errorRealDeBold);

            throw new InternalServerErrorException({
                alerta: 'Rechazo directo de Bold',
                detalles_bold: errorRealDeBold
            });
        }
    }
}