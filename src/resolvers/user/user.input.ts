import { IsEmail, MinLength, NotContains, IsNotEmpty } from "class-validator";
import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { User } from "../../entities/user.entity";
import { FieldError } from "../FieldError";

// or explicit values
export enum Role {
  USER = "user",
  ADMIN = "admin",
}

registerEnumType(Role, {
  name: "Direction", // this one is mandatory
  description: "The basic directions", // this one is optional
});

@InputType()
export class RegisterInput implements Partial<User> {
  @Field(() => String)
  @MinLength(3, {
    message: "Nom d'utilisateur doit être supérieur à 2 caractères",
  })
  @NotContains("@", { message: "Nom d'utilisateur ne doit pas contenir @" })
  username: string;

  @Field(() => String)
  @IsEmail({}, { message: "Email invalid" })
  email: string;

  @Field(() => String)
  @MinLength(8, {
    message: "Mot de passe doit être supérieur à 7 caractères",
  })
  password: string;

  // @Field( () => Role, { nullable: true} )
  // role?: string

  @Field(() => String)
  @IsNotEmpty({ message: "pays non identifié" })
  countryId: string;

  @Field(() => String)
  @IsNotEmpty({ message: "ville non identifié" })
  cityId: string;

  @Field(() => String)
  @IsNotEmpty({ message: "numéro de téléphone vide" })
  phone: string;
}

@InputType()
export class LoginInput implements Partial<User> {
  @Field(() => String)
  @MinLength(3, {
    message: "Nom d'utilisateur ou Email doit être supérieur à 2 caractères",
  })
  usernameOrEmail: string;

  @Field(() => String)
  @MinLength(8, {
    message: "Mot de passe doit être supérieur à 7 caractères",
  })
  password: string;
}

@InputType()
export class ChangePasswordInput {
  @Field(() => String)
  @IsNotEmpty({ message: "token invalide" })
  token: string;

  @Field(() => String)
  @MinLength(8, {
    message: "Mot de passe doit être supérieur à 7 caractères",
  })
  newPassword: string;
}

@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@InputType()
export class EditUserInput implements Partial<User> {
  @Field(() => String)
  @MinLength(3, {
    message: "Nom d'utilisateur doit être supérieur à 2 caractères",
  })
  @NotContains("@", { message: "Nom d'utilisateur ne doit pas contenir @" })
  username: string;

  @Field(() => String)
  @IsEmail({}, { message: "Email invalid" })
  email: string;

  @Field(() => String)
  @IsNotEmpty({ message: "ville non identifié" })
  cityId: string;

  @Field(() => String)
  @IsNotEmpty({ message: "numéro de téléphone vide" })
  phone: string;
}
