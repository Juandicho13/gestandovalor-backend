import { PrismaService } from '../prisma/prisma.service';
import { ESTADO_CANCELADA, ESTADO_PAGO_EN_PROCESO, fechaColombia } from '../reservas/fechas-reserva';

const ESTADOS_ABIERTOS = ['pendiente', 'en progreso', 'en pausa'];

type TareaConFecha = {
    propiedad_id: string;
    estado: string;
    urgencia: string;
    fecha_aseo: Date | null;
    reserva_id: string | null;
};

// Prioridad de cada aseo pendiente según la próxima llegada a ese apartamento,
// contando desde el día del aseo:
//   Urgente:  entra otro huésped ese mismo día
//   Normal:   hay una reserva después, pero no llega ese día
//   Flexible: no hay reservas próximas
// Antes se calculaba una sola vez al agendar. Si después entraba una reserva nueva,
// el aseo se quedaba con la prioridad vieja. Ahora se calcula cada vez que se consulta.
export async function conUrgenciaActual<T extends TareaConFecha>(prisma: PrismaService, tareas: T[]): Promise<T[]> {
    const estaAbierta = (t: T) => !!t.fecha_aseo && ESTADOS_ABIERTOS.includes(String(t.estado || '').toLowerCase());
    const abiertas = tareas.filter(estaAbierta);
    if (abiertas.length === 0) return tareas;

    // Un día de margen hacia atrás para no perder llegadas por la diferencia de zona horaria
    const primerAseo = Math.min(...abiertas.map((t) => new Date(t.fecha_aseo as Date).getTime()));
    const reservas = await prisma.reserva.findMany({
        where: {
            propiedad_id: { in: [...new Set(abiertas.map((t) => t.propiedad_id))] },
            estado_reserva: { notIn: [ESTADO_CANCELADA, ESTADO_PAGO_EN_PROCESO] },
            check_in: { gte: new Date(primerAseo - 24 * 60 * 60 * 1000) },
        },
        select: { id: true, propiedad_id: true, check_in: true },
    });

    const llegadas = new Map<string, { id: string; dia: string }[]>();
    for (const r of reservas) {
        const lista = llegadas.get(r.propiedad_id) || [];
        lista.push({ id: r.id, dia: fechaColombia(r.check_in) });
        llegadas.set(r.propiedad_id, lista);
    }

    return tareas.map((t) => {
        if (!estaAbierta(t)) return t;
        const diaAseo = fechaColombia(t.fecha_aseo as Date);
        const proximas = (llegadas.get(t.propiedad_id) || [])
            .filter((r) => r.id !== t.reserva_id && r.dia >= diaAseo)
            .map((r) => r.dia)
            .sort();
        const urgencia = proximas.length === 0 ? 'Flexible' : proximas[0] === diaAseo ? 'Urgente' : 'Normal';
        return { ...t, urgencia };
    });
}