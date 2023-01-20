import { LoginInput } from "../resolvers/user/user.input";
import { FieldErrorType } from "../resolvers/FieldError";
import { validate } from "class-validator";

export const validateLoginInput = async (loginData: LoginInput) => {
  const validationErrors: Array<FieldErrorType> = [];

  await new Promise<void>((resolve) => {
    validate(loginData).then((errors) => {
      if (errors.length > 0) {
        errors.forEach((error) => {
          const constraints = error.constraints as any;
          const messageKeys: string[] = Object.keys(error.constraints as any);
          const property = error.property;
          messageKeys.forEach((key: string) => {
            validationErrors.push({
              field: property,
              message: constraints[key],
            });
          });
        });
      }
    });
    resolve();
  });

  return validationErrors;
};
