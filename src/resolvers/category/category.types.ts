import { IsNotEmpty } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class AddCategoryInput {
  // only the name is required
  @Field(() => String)
  @IsNotEmpty({ message: "Nom vide" })
  categoryOrCategories: string;

  @Field(() => String, { nullable: true })
  parentId?: string;
}
