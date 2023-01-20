import { validate } from "class-validator";
import { FieldErrorType } from "../resolvers/FieldError";
import { RegisterInput } from "../resolvers/user/user.input";

export const validateRegisterInput = async (registerData: RegisterInput) => {
  const validationErrors: Array<FieldErrorType> = [];

  //   validate(registerData).then((errors) => {
  //     if (errors.length > 0) {
  //       errors.forEach((error) => {
  //         const constraints = error.constraints as any;
  //         const messageKeys: string[] = Object.keys(error.constraints as any);
  //         const property = error.property;
  //         messageKeys.forEach((key: string) => {
  //           validationErrors.push({
  //             field: property,
  //             message: constraints[key],
  //           });
  //         });
  //       });
  //     }
  //   });

  await new Promise<void>((resolve) => {
    validate(registerData).then((errors) => {
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
