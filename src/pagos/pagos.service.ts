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
                'https://integrations.api.bold.co/online/link/v1', // URL Oficial - API Link de pagos (Bold)
                {
                    amount_type: 'CLOSE', // Obligatorio: CLOSE = tú defines el monto
                    amount: {
                        currency: 'COP',
                        total_amount: Number(monto)
                    },
                    reference: `BP-RES-${reservaId}-${Date.now()}`,
                    description: descripcion.substring(0, 95),
                    // 👇 AQUÍ LE DECIMOS A BOLD A DÓNDE REGRESAR AL CLIENTE
                    callback_url: 'https://gestandovalor.com' // Luego puedes cambiar esto a tu página de "reserva exitosa"
                },
                {
                    headers: {
                        'Authorization': `x-api-key ${apiKey}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            const dataBold = response.data?.payload || {};

            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reservaId,
                    monto: Number(monto),
                    estado: 'PENDIENTE',
                    boldLinkId: dataBold.payment_link || 'ID_GENERADO',
                    urlPasarela: dataBold.url || '',
                }
            });

            return {
                success: true,
                pagoId: pago.id,
                linkPago: pago.urlPasarela
            };

        } catch (error) {
            const status = error.response?.status;
            const headers = error.response?.headers;
            const errorRealDeBold = error.response?.data || error.message;

            console.error('❌ Error al llamar a Bold');
            console.error('URL llamada:', error.config?.url);
            console.error('Status HTTP:', status);
            console.error('Headers de la respuesta:', JSON.stringify(headers));
            console.error('Cuerpo de la respuesta:', errorRealDeBold);

            throw new InternalServerErrorException({
                alerta: 'Rechazo directo de Bold',
                detalles_bold: errorRealDeBold
            });
        }
    }
}