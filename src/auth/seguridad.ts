import { SetMetadata } from '@nestjs/common';

/**
 * Marca una ruta como PÚBLICA (no pide token).
 * Todo lo que no lleve este decorador queda protegido automáticamente.
 */
export const ES_PUBLICO = 'es_publico';
export const Publico = () => SetMetadata(ES_PUBLICO, true);

/**
 * Restringe una ruta a ciertos roles. Ej: @Roles('ADMIN', 'AMA_LLAVES')
 * Se valida contra el rol que viene DENTRO del token, no contra lo que diga el navegador.
 */
export const ROLES_PERMITIDOS = 'roles_permitidos';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_PERMITIDOS, roles);
