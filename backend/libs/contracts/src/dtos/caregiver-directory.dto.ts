import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CITIES, PET_SIZES } from '../catalogs';
import { UserRole } from '../enums/user-role.enum';
import { PaginationDto } from './pagination.dto';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Filtros de GET /caregivers: se resuelven en la base, no en el navegador. */
export class CaregiverDirectoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca en nombre, ciudad y biografía' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: CITIES })
  @IsOptional()
  @IsIn(CITIES)
  city?: string;

  @ApiPropertyOptional({ enum: [UserRole.WALKER, UserRole.CAREGIVER] })
  @IsOptional()
  @IsIn([UserRole.WALKER, UserRole.CAREGIVER])
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Tarifa por hora máxima' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_rate?: number;

  @ApiPropertyOptional({ description: 'Calificación mínima (0 a 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({ enum: PET_SIZES })
  @IsOptional()
  @IsIn(PET_SIZES)
  pet_size?: string;

  @ApiPropertyOptional({ description: 'Solo quienes aceptan clientes nuevos' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  available?: boolean;
}
