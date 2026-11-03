import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Alimento Perro Adulto' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Bolsa de 15kg, nutrición completa' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: 25.5, description: 'Precio con hasta 2 decimales' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  price: number;

  @ApiProperty({ example: 'perro' })
  @IsString()
  @MaxLength(60)
  petType: string;

  @ApiProperty({ example: 'alimento' })
  @IsString()
  @MaxLength(60)
  category: string;

  @ApiProperty({
    example: '/uploads/file-1700000000000-abcd.jpg',
    description: 'Ruta devuelta por POST /products/image o una URL http(s)',
  })
  @IsString()
  @MaxLength(500)
  @Matches(/^(https?:\/\/|\/uploads\/)/i, {
    message:
      'La imagen debe ser una URL http(s) o una foto subida (/uploads/...).',
  })
  imageUrl: string;

  @ApiProperty({ example: 10, minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stock: number;
}

/**
 * Edición parcial (PATCH): los mismos 7 campos y las mismas validaciones que
 * CreateProductDto, pero todos opcionales. PartialType hereda las reglas de
 * class-validator, así que no se duplican.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export const PRODUCT_SORTS = [
  'relevancia',
  'precio-asc',
  'precio-desc',
] as const;

const normalize = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Filtros de GET /products: se resuelven en la base, no en el navegador. */
export class ProductsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Busca en título, descripción, categoría y mascota',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ example: 'perro' })
  @IsOptional()
  @Transform(normalize)
  @IsString()
  @MaxLength(60)
  petType?: string;

  @ApiPropertyOptional({ example: 'alimento' })
  @IsOptional()
  @Transform(normalize)
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ enum: PRODUCT_SORTS, default: 'relevancia' })
  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: (typeof PRODUCT_SORTS)[number];
}

/** Valida el `:id` de la ruta (GET / PATCH / DELETE /products/:id). */
export class ProductIdParamDto {
  @ApiProperty({
    example: '64b7f0c2a1d3e4f5a6b7c8da',
    description: 'ID del producto',
  })
  @IsMongoId()
  id: string;
}
