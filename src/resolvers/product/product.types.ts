import { IsNotEmpty } from "class-validator";
import { Field, InputType, Int, ObjectType } from "type-graphql";
import { Product } from "../../entities/product.entity";
import { FieldError } from "../FieldError";

@InputType()
export class AddProductInputType {
  @Field()
  @IsNotEmpty({ message: "nom vide" })
  name: string;

  @Field()
  @IsNotEmpty({ message: "slug vide" })
  slug: string;

  @Field()
  @IsNotEmpty({ message: "prix vide" })
  price: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field()
  @IsNotEmpty({ message: "Utilisateur identifié" })
  userId: string;

  @Field()
  @IsNotEmpty({ message: "Ville non  identifié" })
  cityId: string;

  @Field()
  @IsNotEmpty({ message: "Pays non  identifié" })
  countryId: string;

  @Field()
  @IsNotEmpty({ message: "Catégorie identifié" })
  categoryId: string;

  @Field()
  @IsNotEmpty({ message: "Sous Catégorie identifié" })
  subCategoryId: string;
}

@InputType()
export class EditProductInputType {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  slug?: string;

  @Field(() => String, { nullable: true })
  price?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field()
  productId: string;

  @Field()
  productImagesIds: string;

  // @Field(() => String, { nullable: true })
  // cityId?: string;

  // @Field(() => String, { nullable: true })
  // countryId?: string;

  // @Field(() => String, { nullable: true })
  // categoryId?: string;

  // @Field(() => String, { nullable: true })
  // subCategoryId?: string;
}

@ObjectType()
export class AddProductResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Product, { nullable: true })
  product?: Product;
}

@InputType()
export class PaginatedProductsInput {
  @Field(() => String, { nullable: true })
  cursor?: string;

  @Field(() => Int, { nullable: true })
  limit: number;

  @Field()
  countryId: string;

  // @Field(() => String, { nullable: true })
  // categoryId?: string;
}

@ObjectType()
export class PaginatedProducts {
  @Field(() => [Product])
  data: Product[];

  @Field()
  hasMore: boolean;
}

@ObjectType()
export class PaginatedSearchProducts {
  @Field(() => [Product])
  data: Product[];

  @Field()
  hasMore: boolean;
}
