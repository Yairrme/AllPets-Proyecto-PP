import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    type: 'integer',
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Número de página (entero, mínimo 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    type: 'integer',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Cantidad de elementos por página (entero, de 1 a 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
