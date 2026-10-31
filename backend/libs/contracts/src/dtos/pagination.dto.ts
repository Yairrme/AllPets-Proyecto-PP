import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO reutilizable para paginar listados mediante query params (`?page=1&limit=20`).
 * Convierte automáticamente los strings de la URL a números enteros y limita el
 * tamaño máximo por página a 100 registros para evitar sobrecargar MongoDB.
 */
export class PaginationDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Número de página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Cantidad de elementos por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
