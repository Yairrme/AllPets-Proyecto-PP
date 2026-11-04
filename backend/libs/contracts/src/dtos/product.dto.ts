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
  @ApiProperty({
    example: 'Alimento Perro Adulto',
    minLength: 2,
    maxLength: 120,
    description: 'Nombre del producto (entre 2 y 120 caracteres)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    example: 'Bolsa de 15kg, nutrición completa',
    minLength: 2,
    maxLength: 1000,
    description: 'Descripción del producto (entre 2 y 1000 caracteres)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    type: 'number',
    example: 25.5,
    minimum: 0,
    maximum: 10_000_000,
    description: 'Precio, de 0 a 10.000.000, con hasta 2 decimales',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  price: number;

  @ApiProperty({
    example: 'perro',
    maxLength: 60,
    description:
      'Tipo de mascota al que apunta el producto (texto libre, máx. 60)',
  })
  @IsString()
  @MaxLength(60)
  petType: string;

  @ApiProperty({
    example: 'alimento',
    maxLength: 60,
    description: 'Categoría del producto (texto libre, máx. 60)',
  })
  @IsString()
  @MaxLength(60)
  category: string;

  @ApiProperty({
    example: 'https://ejemplo.com/foto.jpg',
    maxLength: 500,
    description: 'URL o ruta de la imagen (texto, máx. 500 caracteres)',
  })
  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @ApiProperty({
    type: 'integer',
    example: 10,
    minimum: 0,
    maximum: 1_000_000,
    description: 'Unidades en stock (entero de 0 a 1.000.000)',
  })
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
