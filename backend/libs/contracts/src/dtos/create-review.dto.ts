import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO para la creación de una reseña o calificación hacia un paseador/cuidador.
 * Nota de seguridad: aunque `reviewer_id` existe en el contrato para enviarse por TCP
 * al microservicio, el API Gateway lo sobrescribe con el `sub` del token JWT del
 * cliente autenticado para impedir que alguien publique reseñas a nombre de otro.
 */
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
  @IsString()
  @IsNotEmpty({ message: 'El ID del cuidador es obligatorio (caregiver_id).' })
  caregiver_id: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Puntuación del 1 al 5',
  })
  @IsNumber()
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
  comment?: string;
}
