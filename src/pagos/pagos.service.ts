import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            // 1. Limpiamos la llave por si se pegó con un espacio invisible en Render
            const apiKey = process.env.BOLD_SECRET_KEY_TEST?.trim() || '';

            // 2. Petición a Bold con el formato exacto
            const response = await axios.post(
                'https://integrations.api.bold.co/online/link/v1',
                {
                    amount_type: 'CLOSE',
                    amount: {
                        currency: 'COP',
                        total_amount: Number(monto) // Aseguramos que sea un número estricto
                    },
                    reference: `BP-RES-${reservaId}-${Date.now()}`,
                    description: descripcion.substring(0, 95), // Bold exige máximo 100 caracteres
                },
                {
                    headers: {
                        // Mandamos ambos por si Bold se pone exquisito con sus políticas
                        'Authorization': `x-api-key ${apiKey}`,
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json',
                    }
                }
            );

            // 3. Extraemos la data
            const dataBold = response.data?.payload || response.data;

            // 4. Guardamos en tu base de datos
            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reservaId,
                    monto: Number(monto),
                    estado: 'PENDIENTE',
                    boldLinkId: dataBold.payment_link || dataBold.id || 'ID_GENERADO',
                    urlPasarela: dataBold.url || dataBold.pay_link || '',
                }
            });

            return {
                success: true,
                pagoId: pago.id,
                linkPago: pago.urlPasarela
            };

        } catch (error) {
            // 🔥 LA MAGIA ESTÁ AQUÍ: Capturamos la verdadera respuesta de Bold
            const errorRealDeBold = error.response?.data || error.message;
            console.error('Error detallado con Bold:', errorRealDeBold);

            // En vez de un error genérico, te lo disparamos a tu pantalla para verlo
            throw new InternalServerErrorException({
                alerta: 'Rechazo directo de Bold',
                detalles_bold: errorRealDeBold
            });
        }
    }
}