import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsMongoId,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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

  @ApiProperty({ example: 'https://…/foto.jpg' })
  @IsString()
  @MaxLength(500)
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

/** Valida el `:id` de la ruta (GET / PATCH / DELETE /products/:id). */
export class ProductIdParamDto {
  @ApiProperty({
    example: '64b7f0c2a1d3e4f5a6b7c8da',
    description: 'ID del producto',
  })
  @IsMongoId()
  id: string;
}
