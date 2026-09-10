import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    async crearEnlaceDePago(reservaId: string, monto: number, descripcion: string) {
        try {
            // Usamos la llave secreta de pruebas que pusiste en el .env
            const apiKey = process.env.BOLD_SECRET_KEY_TEST;

            // Petición a la API de Bold para generar el link
            const response = await axios.post(
                'https://integrations.api.bold.co/online/v1/payment-links',
                {
                    amount: {
                        currency: 'COP',
                        total_amount: monto
                    },
                    reference: `GV-RES-${reservaId}-${Date.now()}`, // Referencia única
                    description: descripcion,
                },
                {
                    headers: {
                        'Authorization': `Api-Key ${apiKey}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            const data = response.data;

            // Guardamos el intento de pago en la base de datos
            const pago = await this.prisma.pago.create({
                data: {
                    reservaId,
                    monto,
                    estado: 'PENDIENTE',
                    boldLinkId: data.id,
                    urlPasarela: data.url || data.pay_link, // La URL que nos devuelve Bold
                },
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