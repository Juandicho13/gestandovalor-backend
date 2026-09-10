import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            const apiKey = process.env.BOLD_SECRET_KEY_TEST;

            const response = await axios.post(
                'https://integrations.api.bold.co/online/link/v1', // <-- 1. URL oficial corregida
                {
                    amount_type: 'CLOSE', // <-- 2. Obligatorio: indica que el monto es exacto
                    amount: {
                        currency: 'COP',
                        total_amount: monto
                    },
                    reference: `BP-RES-${reservaId}-${Date.now()}`,
                    description: descripcion,
                },
                {
                    headers: {
                        'Authorization': `x-api-key ${apiKey}`, // <-- 3. Formato exacto que pide la seguridad de Bold
                        'Content-Type': 'application/json',
                    }
                }
            );

            // 4. Bold devuelve la información envuelta en un "payload"
            const dataBold = response.data.payload;

            // Guardamos en tu base de datos de Prisma
            const pago = await this.prisma.pago.create({
                data: {
                    reservaId: reservaId,
                    monto: monto,
                    estado: 'PENDIENTE',
                    boldLinkId: dataBold.payment_link, // Extraemos el ID del link real
                    urlPasarela: dataBold.url          // Extraemos la URL para redirigir
                }
            });

            return {
                success: true,
                pagoId: pago.id,
                linkPago: pago.urlPasarela
            };

        } catch (error) {
            console.error('Error con Bold:', error.response?.data || error.message);
            throw new InternalServerErrorException('Error al generar el enlace de pago.');
        }
    }
}