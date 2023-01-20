import { Field, ObjectType } from "type-graphql";

// for typescript type usage
export interface FieldErrorType {
    field: string
    message: string
}

@ObjectType()
export class FieldError {
    @Field(() => String)
    field: string;

    @Field(() => String)
    message: string;
}