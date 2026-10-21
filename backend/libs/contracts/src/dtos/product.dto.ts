import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
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
