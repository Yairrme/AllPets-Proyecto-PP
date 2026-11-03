import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PET_SIZES, ProfileStatus } from 'y/contracts';
import { User } from './user.schema';

export type CaregiverProfileDocument = CaregiverProfile & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class CaregiverProfile {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user_id: Types.ObjectId | User;

  @Prop({ required: false, default: '' })
  bio: string;

  @Prop({ type: [String], default: [] })
  services: string[];

  @Prop({ required: false, default: 0 })
  rating_avg: number;

  @Prop({ required: false, default: 0 })
  total_reviews: number;

  @Prop({ required: false, default: 4000 })
  hourly_rate: number;

  @Prop({ required: false, default: 1 })
  experience_years: number;

  @Prop({
    type: [String],
    default: [...PET_SIZES],
  })
  accepted_sizes: string[];

  @Prop({ type: [String], default: [] })
  availability: string[];

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ type: [String], default: [] })
  certification_documents: string[];

  @Prop({ required: false, default: '' })
  profile_image: string;

  @Prop({ type: [String], default: [] })
  gallery_images: string[];

  // El propio paseador/cuidador decide si toma clientes nuevos. Los clientes
  // lo ven como "Disponible" / "No disponible" en el directorio público.
  @Prop({ type: Boolean, default: true })
  is_available: boolean;

  // SCRUM-112: estado de validación del perfil. Los perfiles creados antes de
  // este campo no lo tienen en Mongo y se consideran aprobados (default).
  // Los perfiles nuevos se crean como PENDING en CoreUserService.register.
  @Prop({
    type: String,
    enum: ProfileStatus,
    default: ProfileStatus.APPROVED,
    index: true,
  })
  status: ProfileStatus;
}

export const CaregiverProfileSchema =
  SchemaFactory.createForClass(CaregiverProfile);
// Filtros del directorio público.
CaregiverProfileSchema.index({ status: 1, hourly_rate: 1 });
CaregiverProfileSchema.index({ status: 1, rating_avg: -1 });
