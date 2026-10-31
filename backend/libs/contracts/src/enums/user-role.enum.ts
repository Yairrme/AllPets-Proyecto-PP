/**
 * Roles disponibles dentro de la plataforma All Pets.
 * Se comparte en `y/contracts` para que tanto el API Gateway como los
 * microservicios validen permisos con los mismos valores.
 */
export enum UserRole {
  /** Dueño de mascota que busca y contrata paseadores o cuidadores */
  CLIENT = 'client',
  /** Paseador de perros profesional */
  WALKER = 'walker',
  /** Cuidador de mascotas (guardería o cuidado a domicilio) */
  CAREGIVER = 'caregiver',
  /** Administrador del sistema con permisos globales */
  ADMIN = 'admin',
}
