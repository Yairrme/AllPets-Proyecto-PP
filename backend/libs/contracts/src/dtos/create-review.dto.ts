import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiPropertyOptional({
    description: 'ID del autor (se inyecta automáticamente desde el token JWT)',
  })
  @IsString()
  @IsOptional()
  reviewer_id: string;

  @ApiProperty({
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID del cuidador o paseador al que se le hace la reseña',
  })
  @IsMongoId({ message: 'El ID del cuidador no es válido.' })
  @IsNotEmpty({ message: 'El ID del cuidador es obligatorio (caregiver_id).' })
  caregiver_id: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Puntuación del 1 al 5',
  })
  @IsInt({ message: 'La calificación debe ser un número entero.' })
  @Min(1, { message: 'La calificación mínima es 1.' })
  @Max(5, { message: 'La calificación máxima es 5.' })
  @IsNotEmpty({ message: 'La calificación es obligatoria.' })
  score: number;

  @ApiPropertyOptional({
    example: 'Excelente trato con mis mascotas y muy responsable.',
    description: 'Comentario u opinión opcional sobre el servicio',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'El comentario no puede superar 500 caracteres.' })
  comment?: string;
}

/** Edición de la propia reseña: las mismas reglas de calificación y comentario. */
export class UpdateReviewDto extends PartialType(
  PickType(CreateReviewDto, ['score', 'comment'] as const),
) {}

export class ReviewIdParamDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId({ message: 'El ID de la reseña no es válido.' })
  reviewId: string;
}
