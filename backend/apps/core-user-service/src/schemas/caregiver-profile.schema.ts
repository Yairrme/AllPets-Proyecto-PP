import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type CaregiverProfileDocument = CaregiverProfile & Document;

@Schema({ 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class CaregiverProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  user_id: Types.ObjectId | User;

  @Prop({ required: false, default: '' })
  bio: string;

  @Prop({ type: [String], default: [] })
  services: string[];

  @Prop({ required: false, default: 0 })
  rating_avg: number;

  @Prop({ type: [String], default: [] })
  availability: string[];

  @Prop({ required: false, default: '' })
  profile_image: string;

  @Prop({ type: [String], default: [] })
  gallery_images: string[];
}

export const CaregiverProfileSchema = SchemaFactory.createForClass(CaregiverProfile);
