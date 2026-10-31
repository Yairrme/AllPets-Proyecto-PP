/**
 * Punto de entrada (barrel file) de la librería compartida `y/contracts`.
 * Exporta todos los DTOs y Enums para que el API Gateway y los microservicios
 * los importen directamente desde `'y/contracts'`.
 */
export * from './contracts.module';
export * from './contracts.service';
export * from './enums/user-role.enum';
export * from './dtos/register.dto';
export * from './dtos/login.dto';
export * from './dtos/create-review.dto';
export * from './dtos/update-caregiver-profile.dto';
export * from './dtos/update-user.dto';
export * from './dtos/pagination.dto';
