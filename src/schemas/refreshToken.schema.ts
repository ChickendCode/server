import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import { Document, ObjectId } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema()
export class RefreshToken {
  @Transform(({ value }) => value.toString())
  id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  @Type(() => User)
  user: User;

  @Prop({ default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
  expires: Date;

  @Prop()
  createdByIp: string;

  @Prop()
  userAgent: string;

  @Prop()
  revokedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: RefreshToken.name })
  replacedByToken: ObjectId;

  isExpired: boolean;

  isActive: boolean;
}

const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.virtual('isExpired').get(function (
  this: RefreshTokenDocument,
) {
  return new Date() > this.expires;
});

RefreshTokenSchema.virtual('isActive').get(function (
  this: RefreshTokenDocument,
) {
  return !this.isExpired && !this.revokedAt;
});

export { RefreshTokenSchema };
