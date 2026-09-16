import { PrismaService } from '../prisma/prisma.service';

// Estados que usa el flujo de pago en línea
export const ESTADO_PAGO_EN_PROCESO = 'Pago en Proceso';
export const ESTADO_CONFIRMADA = 'Confirmada';
export const ESTADO_CANCELADA = 'Cancelada';

// Tiempo que se apartan las fechas mientras el huésped paga en Bold
export const MINUTOS_RESERVA_TEMPORAL = 30;

// Colombia es UTC-5 todo el año (no tiene horario de verano)
const OFFSET_COLOMBIA_MS = 5 * 60 * 60 * 1000;

// Convierte una fecha a 'YYYY-MM-DD' en hora de Colombia
export function fechaColombia(fecha: Date | string): string {
    const d = new Date(fecha);
    return new Date(d.getTime() - OFFSET_COLOMBIA_MS).toISOString().slice(0, 10);
}

export function esFechaValida(valor: unknown): valor is string {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    return !isNaN(new Date(`${valor}T12:00:00-05:00`).getTime());
}

// Dos estadías se cruzan si una empieza antes de que la otra termine (por noches)
export function seCruzan(inA: string, outA: string, inB: string, outB: string): boolean {
    return inA < outB && outA > inB;
}

// Las reservas que quedaron "Pago en Proceso" más de 30 minutos liberan sus fechas
export async function liberarReservasVencidas(prisma: PrismaService) {
    const limite = new Date(Date.now() - MINUTOS_RESERVA_TEMPORAL * 60 * 1000);
    await prisma.reserva.updateMany({
        where: { estado_reserva: ESTADO_PAGO_EN_PROCESO, created_at: { lt: limite } },
        data: { estado_reserva: ESTADO_CANCELADA },
    });
}

// Reservas activas (no canceladas) que se cruzan con un rango de fechas
export async function buscarReservasQueSeCruzan(
    prisma: PrismaService,
    llegada: string,
    salida: string,
    propiedadId?: string,
) {
    await liberarReservasVencidas(prisma);

    const candidatas = await prisma.reserva.findMany({
        where: {
            ...(propiedadId ? { propiedad_id: propiedadId } : {}),
            estado_reserva: { not: ESTADO_CANCELADA },
            check_in: { lt: new Date(`${salida}T23:59:59-05:00`) },
            check_out: { gt: new Date(`${llegada}T00:00:00-05:00`) },
        },
        select: { id: true, propiedad_id: true, check_in: true, check_out: true },
    });

    return candidatas.filter((r) =>
        seCruzan(fechaColombia(r.check_in), fechaColombia(r.check_out), llegada, salida),
    );
}