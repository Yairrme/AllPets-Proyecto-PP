import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type CaregiverProfileDocument = CaregiverProfile & Document;

/**
 * Esquema Mongoose para la colección `caregiverprofiles`.
 * Mantiene una relación 1 a 1 con `User` (mediante `user_id` único) y almacena toda la
 * información profesional del paseador o cuidador: biografía, tarifas, tamaños aceptados,
 * galería de fotos, comprobantes de certificación y promedio de reseñas.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class CaregiverProfile {
  /** Referencia al `_id` del usuario dueño de este perfil profesional */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user_id: Types.ObjectId | User;

  /** Descripción o presentación personal del trabajador */
  @Prop({ required: false, default: '' })
  bio: string;

  /** Especialidades o tipos de servicios que ofrece (ej. Paseo, Guardería, Visitas) */
  @Prop({ type: [String], default: [] })
  services: string[];

  /** Promedio histórico de estrellas (1 a 5), recalculado automáticamente al recibir reseñas */
  @Prop({ required: false, default: 0 })
  rating_avg: number;

  /** Cantidad total de reseñas recibidas */
  @Prop({ required: false, default: 0 })
  total_reviews: number;

  /** Tarifa por hora en pesos argentinos (ARS) */
  @Prop({ required: false, default: 4000 })
  hourly_rate: number;

  /** Años de experiencia trabajando con mascotas */
  @Prop({ required: false, default: 1 })
  experience_years: number;

  /** Tamaños de perros/mascotas que acepta (`pequeño`, `mediano`, `grande`) */
  @Prop({
    type: [String],
    default: ['pequeño', 'mediano', 'grande'],
  })
  accepted_sizes: string[];

  /** Días u horarios disponibles para trabajar */
  @Prop({ type: [String], default: [] })
  availability: string[];

  /** Nombres de certificaciones, cursos o permisos municipales declarados */
  @Prop({ type: [String], default: [] })
  certifications: string[];

  /** Rutas en `/uploads` de las imágenes de comprobantes/certificados subidos */
  @Prop({ type: [String], default: [] })
  certification_documents: string[];

  /** Foto de portada/perfil profesional del cuidador o paseador */
  @Prop({ required: false, default: '' })
  profile_image: string;

  /** Galería de fotos del trabajador con mascotas (`/uploads/...`) */
  @Prop({ type: [String], default: [] })
  gallery_images: string[];
}

export const CaregiverProfileSchema =
  SchemaFactory.createForClass(CaregiverProfile);
