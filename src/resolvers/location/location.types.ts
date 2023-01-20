import { Field, ObjectType } from "type-graphql";
import { Country } from '../../entities/country.entity';

// @ObjectType()
// export class Country {}

@ObjectType()
export class LocationResponse {
  @Field(() => String,{nullable: true})
  error?: string;

  @Field(() => Country, { nullable: true})
  country?: Country;
}
