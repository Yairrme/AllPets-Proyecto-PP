import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CITIES, UserRole } from 'y/contracts';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({
    type: String,
    required: true,
    enum: CITIES,
    default: CITIES[0],
  })
  city: string;

  @Prop({ required: false, default: null })
  phone: string;

  @Prop({ required: false, default: null })
  profile_image: string;

  @Prop({
    type: String,
    required: true,
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
// Listados de administración y de prestadores, ordenados por fecha.
UserSchema.index({ role: 1, created_at: -1 });
