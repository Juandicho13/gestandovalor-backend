import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
    ESTADO_CANCELADA,
    ESTADO_CONFIRMADA,
    ESTADO_PAGO_EN_PROCESO,
    buscarReservasQueSeCruzan,
    esFechaValida,
    fechaColombia,
} from '../reservas/fechas-reserva';

const N8N_WEBHOOK_URL =
    process.env.N8N_WEBHOOK_URL ||
    'https://juanchisolarte.app.n8n.cloud/webhook-test/2cd97a71-18f1-4a6f-b09e-d9ebf2e12a2b';

type EstadoVerificacion = 'aprobado' | 'pendiente' | 'rechazado';

@Injectable()
export class PagosService {
    constructor(private prisma: PrismaService) { }

    private llaves() {
        const llaveSecreta = (process.env.BOLD_PRIVATE_KEY || '').trim();
        const llaveIdentidad = (process.env.BOLD_PUBLIC_KEY || '').trim();
        if (!llaveSecreta || !llaveIdentidad) {
            console.error('Bold: faltan BOLD_PRIVATE_KEY o BOLD_PUBLIC_KEY en las variables de entorno');
            throw new InternalServerErrorException('La pasarela de pagos no está configurada');
        }
        return { llaveSecreta, llaveIdentidad };
    }

    // ============================================================
    // 1. El huésped da clic en "Pagar": apartamos fechas y firmamos
    // ============================================================
    async crearReservaYPago(body: any) {
        const { llaveSecreta, llaveIdentidad } = this.llaves();

        const nombre = String(body?.huesped_nombre || '').trim();
        const telefono = String(body?.huesped_telefono || '').replace(/\D/g, '');
        const email = String(body?.huesped_email || '').trim().toLowerCase();
        const llegada = body?.check_in;
        const salida = body?.check_out;
        const adultos = Math.max(1, parseInt(body?.adultos, 10) || 1);
        const ninos = Math.max(0, parseInt(body?.ninos, 10) || 0);
        const bebes = Math.max(0, parseInt(body?.bebes, 10) || 0);
        const mascotas = Math.max(0, parseInt(body?.mascotas, 10) || 0);
        const monto = Math.round(Number(body?.monto_total));

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
        if (nombre.length < 3 || telefono.length < 7 || telefono.length > 15 || !emailOk) {
            throw new BadRequestException('Completa tu nombre, celular y correo');
        }
        if (!esFechaValida(llegada) || !esFechaValida(salida) || salida <= llegada) {
            throw new BadRequestException('Las fechas no son válidas');
        }
        if (llegada < fechaColombia(new Date())) {
            throw new BadRequestException('La fecha de llegada ya pasó');
        }
        if (!Number.isFinite(monto) || monto <= 0) {
            throw new BadRequestException('El monto no es válido');
        }

        const propiedad = await this.prisma.propiedad.findUnique({
            where: { id: String(body?.propiedad_id || '') },
            select: { id: true, capacidad_huespedes: true },
        });
        if (!propiedad) {
            throw new NotFoundException('El alojamiento no existe');
        }
        if (propiedad.capacidad_huespedes && adultos + ninos > propiedad.capacidad_huespedes) {
            throw new BadRequestException('Superas la capacidad máxima del alojamiento');
        }

        const cruces = await buscarReservasQueSeCruzan(this.prisma, llegada, salida, propiedad.id);
        if (cruces.length > 0) {
            throw new ConflictException('Estas fechas ya no están disponibles');
        }

        const referencia = `BP-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const moneda = 'COP';

        // Hash de integridad: {orderId}{amount}{currency}{llaveSecreta}
        const hash = crypto
            .createHash('sha256')
            .update(`${referencia}${monto}${moneda}${llaveSecreta}`, 'utf8')
            .digest('hex');

        try {
            // La reserva queda "Pago en Proceso": aparta las fechas 30 minutos,
            // pero no aparece en tu calendario hasta que Bold apruebe el pago.
            await this.prisma.reserva.create({
                data: {
                    propiedad_id: propiedad.id,
                    huesped_nombre: nombre,
                    huesped_telefono: telefono,
                    huesped_email: email,
                    check_in: new Date(`${llegada}T15:00:00-05:00`),
                    check_out: new Date(`${salida}T11:00:00-05:00`),
                    canal: 'Directa',
                    monto_total: monto,
                    cantidad_huespedes: adultos + ninos,
                    adultos,
                    ninos,
                    bebes,
                    mascotas,
                    estado_reserva: ESTADO_PAGO_EN_PROCESO,
                    pagos: {
                        create: {
                            monto,
                            moneda,
                            estado: 'PENDIENTE',
                            boldLinkId: referencia,
                            urlPasarela: 'WIDGET',
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Bold: error creando la reserva temporal:', error);
            throw new InternalServerErrorException('No se pudo registrar la reserva');
        }

        return {
            success: true,
            referencia,
            hash,
            monto,
            moneda,
            apiKey: llaveIdentidad, // La llave de identidad es pública
        };
    }

    // ============================================================
    // 2. La página de confirmación pregunta cómo quedó el pago
    // ============================================================
    async verificarPago(referencia: string) {
        if (!referencia || typeof referencia !== 'string') {
            throw new BadRequestException('Falta la referencia del pago');
        }

        const pago = await this.buscarPago(referencia);
        if (!pago) {
            throw new NotFoundException('No encontramos ese pago');
        }

        if (pago.estado === 'APROBADA') return this.respuesta('aprobado', pago);
        if (pago.estado === 'RECHAZADA' || pago.estado === 'CANCELADA') return this.respuesta('rechazado', pago);

        const estadoBold = await this.consultarEstadoEnBold(referencia);

        if (estadoBold === 'APPROVED') {
            await this.aprobarPago(pago.id);
            return this.respuesta('aprobado', pago);
        }
        if (estadoBold === 'REJECTED' || estadoBold === 'FAILED' || estadoBold === 'VOIDED') {
            await this.rechazarPago(pago.id);
            return this.respuesta('rechazado', pago);
        }

        // PROCESSING, PENDING (PSE) o NO_TRANSACTION_FOUND (Bold aún no lo reporta)
        return this.respuesta('pendiente', pago);
    }

    // ============================================================
    // 3. Bold avisa directamente al backend (solo en producción)
    // ============================================================
    async procesarWebhook(cuerpoCrudo: Buffer | undefined, firma: string | undefined, body: any) {
        const referencia = body?.data?.metadata?.reference;
        const tipo = body?.type;

        if (!referencia) return { recibido: true };

        const pago = await this.buscarPago(String(referencia));
        if (!pago) return { recibido: true };

        if (this.firmaValida(cuerpoCrudo, firma)) {
            if (tipo === 'SALE_APPROVED') await this.aprobarPago(pago.id);
            else if (tipo === 'SALE_REJECTED') await this.rechazarPago(pago.id);
            else if (tipo === 'VOID_APPROVED') await this.anularPago(pago.id);
        } else {
            // Si la firma no coincide no confiamos en el contenido:
            // le preguntamos directamente a Bold cómo quedó el pago.
            try {
                await this.verificarPago(String(referencia));
            } catch (error) {
                console.error('Bold webhook: no se pudo verificar la referencia', referencia, error);
            }
        }

        return { recibido: true };
    }

    // ------------------------------------------------------------
    // Utilidades internas
    // ------------------------------------------------------------
    private buscarPago(referencia: string) {
        return this.prisma.pago.findFirst({
            where: { boldLinkId: referencia },
            include: { reserva: { include: { propiedad: { select: { titulo: true } } } } },
        });
    }

    private respuesta(estado: EstadoVerificacion, pago: any) {
        return {
            estado,
            referencia: pago.boldLinkId,
            alojamiento: pago.reserva?.propiedad?.titulo || '',
            check_in: pago.reserva ? fechaColombia(pago.reserva.check_in) : '',
            check_out: pago.reserva ? fechaColombia(pago.reserva.check_out) : '',
            monto: pago.monto,
        };
    }

    private firmaValida(cuerpoCrudo: Buffer | undefined, firma: string | undefined) {
        const llaveSecreta = (process.env.BOLD_PRIVATE_KEY || '').trim();
        if (!cuerpoCrudo || !firma || !llaveSecreta) return false;

        const calculada = crypto
            .createHmac('sha256', llaveSecreta)
            .update(cuerpoCrudo.toString('base64'))
            .digest('hex');

        const a = Buffer.from(calculada);
        const b = Buffer.from(String(firma));
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    }

    private async consultarEstadoEnBold(referencia: string): Promise<string | null> {
        const { llaveIdentidad } = this.llaves();
        const controlador = new AbortController();
        const tiempoLimite = setTimeout(() => controlador.abort(), 8000);

        try {
            const res = await fetch(
                `https://payments.api.bold.co/v2/payment-voucher/${encodeURIComponent(referencia)}`,
                { headers: { Authorization: `x-api-key ${llaveIdentidad}` }, signal: controlador.signal },
            );
            if (!res.ok) {
                console.warn('Bold: consulta de estado respondió', res.status, 'para', referencia);
                return null;
            }
            const data: any = await res.json();
            return String(data?.payment_status || '').toUpperCase();
        } catch (error) {
            console.warn('Bold: no se pudo consultar el estado de', referencia, error);
            return null;
        } finally {
            clearTimeout(tiempoLimite);
        }
    }

    private async aprobarPago(pagoId: string) {
        // updateMany con condición evita procesar dos veces (webhook + página)
        const cambio = await this.prisma.pago.updateMany({
            where: { id: pagoId, estado: { not: 'APROBADA' } },
            data: { estado: 'APROBADA' },
        });
        if (cambio.count === 0) return;

        const pago = await this.prisma.pago.findUnique({ where: { id: pagoId }, include: { reserva: true } });
        if (!pago?.reserva) return;

        const reserva = await this.prisma.reserva.update({
            where: { id: pago.reserva.id },
            data: { estado_reserva: ESTADO_CONFIRMADA },
        });

        // Si el pago llegó tarde y alguien más tomó las fechas, lo marcamos para revisión
        const cruces = await buscarReservasQueSeCruzan(
            this.prisma,
            fechaColombia(reserva.check_in),
            fechaColombia(reserva.check_out),
            reserva.propiedad_id,
        );
        const hayConflicto = cruces.some((r) => r.id !== reserva.id);
        if (hayConflicto) {
            console.warn('Bold: reserva pagada con fechas en conflicto', reserva.id);
        }

        this.notificarN8n({
            evento: 'RESERVA_CONFIRMADA',
            reserva_id: reserva.id,
            referencia_pago: pago.boldLinkId,
            huesped_nombre: reserva.huesped_nombre,
            huesped_telefono: reserva.huesped_telefono,
            huesped_email: reserva.huesped_email,
            monto_total: reserva.monto_total,
            check_in: reserva.check_in,
            check_out: reserva.check_out,
            cantidad_huespedes: reserva.cantidad_huespedes,
            mascotas: reserva.mascotas,
            propiedad_id: reserva.propiedad_id,
            alerta: hayConflicto ? 'FECHAS_EN_CONFLICTO' : null,
        });
    }

    private async rechazarPago(pagoId: string) {
        const cambio = await this.prisma.pago.updateMany({
            where: { id: pagoId, estado: 'PENDIENTE' },
            data: { estado: 'RECHAZADA' },
        });
        if (cambio.count === 0) return;

        const pago = await this.prisma.pago.findUnique({ where: { id: pagoId } });
        if (!pago) return;

        await this.prisma.reserva.updateMany({
            where: { id: pago.reservaId, estado_reserva: { not: ESTADO_CONFIRMADA } },
            data: { estado_reserva: ESTADO_CANCELADA },
        });
    }

    private async anularPago(pagoId: string) {
        const pago = await this.prisma.pago.update({
            where: { id: pagoId },
            data: { estado: 'CANCELADA' },
        });
        await this.prisma.reserva.update({
            where: { id: pago.reservaId },
            data: { estado_reserva: ESTADO_CANCELADA },
        });
    }

    private notificarN8n(datos: Record<string, unknown>) {
        fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
        }).catch((err) => console.error('Error de red enviando a n8n:', err));
    }
}