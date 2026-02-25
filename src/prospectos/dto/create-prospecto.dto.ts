export class CreateProspectoDto {
  nombre: string;
  telefono: string;
  email?: string;
  ciudadPropiedad: string;
  mensaje?: string;
  fechaReunion?: string; // NUEVO
  horaReunion?: string;  // NUEVO
}