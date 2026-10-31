import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from 'y/contracts';

export type UserDocument = User & Document;

/**
 * Esquema Mongoose para la colección `users` en MongoDB.
 * Representa tanto a clientes dueños de mascotas como a paseadores, cuidadores y administradores.
 * Nota: si el usuario tiene rol `walker` o `caregiver`, sus datos profesionales adicionales
 * se almacenan en la colección `caregiverprofiles` vinculada por `user_id`.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class User {
  /** Nombre completo del usuario */
  @Prop({ required: true })
  name: string;

  /** Correo electrónico único (indexado para búsquedas rápidas en login y registro) */
  @Prop({ required: true, unique: true, index: true })
  email: string;

  /** Hash bcrypt de la contraseña (nunca se almacena en texto plano ni se devuelve en respuestas) */
  @Prop({ required: true })
  password_hash: string;

  /** Ciudad de cobertura del usuario (restringido a Cipolletti o Neuquén) */
  @Prop({
    type: String,
    required: true,
    enum: ['Cipolletti', 'Neuquén'],
    default: 'Cipolletti',
  })
  city: string;

  /** Número de teléfono cifrado en reposo con AES-256-GCM (`enc:v1:...`) */
  @Prop({ required: false, default: null })
  phone: string;

  /** Ruta relativa del avatar del usuario (ej: `/uploads/file-...jpg`) */
  @Prop({ required: false, default: null })
  profile_image: string;

  /** Rol que determina los permisos y vistas del usuario en el sistema */
  @Prop({
    type: String,
    required: true,
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
