import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_PERMITIDOS } from './seguridad';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(contexto: ExecutionContext): boolean {
        const permitidos = this.reflector.getAllAndOverride<string[]>(
            ROLES_PERMITIDOS,
            [contexto.getHandler(), contexto.getClass()],
        );
        if (!permitidos || permitidos.length === 0) return true;

        const req = contexto.switchToHttp().getRequest();
        const usuario = req.usuario;

        if (!usuario || !permitidos.includes(usuario.rol)) {
            throw new ForbiddenException('No tienes permiso para esta acción');
        }
        return true;
    }
}