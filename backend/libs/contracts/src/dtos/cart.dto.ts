import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, Max, Min } from 'class-validator';

export const MAX_QUANTITY_PER_ITEM = 99;

export class AddCartItemDto {
  @ApiProperty({
    example: '64b7f0c2a1d3e4f5a6b7c8da',
    description: 'ID del producto',
  })
  @IsMongoId()
  productId: string;

  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: MAX_QUANTITY_PER_ITEM,
    description: 'Cantidad a agregar (entero de 1 a 99)',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY_PER_ITEM)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({
    type: 'integer',
    example: 2,
    minimum: 1,
    maximum: MAX_QUANTITY_PER_ITEM,
    description: 'Nueva cantidad total del producto (entero de 1 a 99)',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY_PER_ITEM)
  quantity: number;
}

export class CartItemParamDto {
  @ApiProperty({
    example: '64b7f0c2a1d3e4f5a6b7c8da',
    description: 'ID del producto',
  })
  @IsMongoId()
  productId: string;
}
