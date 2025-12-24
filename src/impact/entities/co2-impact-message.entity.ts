import { ObjectType, Field, ID, Float, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@shareable')
export class Co2ImpactMessage {
  @Field(() => ID)
  id: number;

  @Field(() => Float, { nullable: true })
  min?: number | null;

  @Field(() => Float, { nullable: true })
  max?: number | null;

  @Field(() => String, { nullable: true })
  message1?: string | null;

  @Field(() => String, { nullable: true })
  message2?: string | null;

  @Field(() => String, { nullable: true })
  message3?: string | null;
}
