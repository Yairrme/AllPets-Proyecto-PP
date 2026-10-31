import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type ReviewDocument = Review & Document;

/**
 * Esquema Mongoose para la colección `reviews`.
 * Almacena las valoraciones (1 a 5 estrellas + comentario) que los clientes (`reviewer_id`)
 * dejan a los paseadores o cuidadores (`caregiver_id`).
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Review {
  /** ID del usuario con rol `client` que escribe la reseña */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reviewer_id: Types.ObjectId | User;

  /** ID del usuario con rol `walker` o `caregiver` que recibe la reseña */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  caregiver_id: Types.ObjectId | User;

  /** Calificación numérica entre 1 y 5 estrellas */
  @Prop({ required: true, min: 1, max: 5 })
  score: number;

  /** Comentario opcional sobre la experiencia con el cuidador/paseador */
  @Prop({ required: false, default: '' })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
/**
 * Índice único compuesto: garantiza a nivel de base de datos que un mismo cliente
 * no pueda dejar más de una reseña al mismo cuidador/paseador.
 */
ReviewSchema.index({ reviewer_id: 1, caregiver_id: 1 }, { unique: true });
