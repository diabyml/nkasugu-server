import argon2 from "argon2";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../../constants";
import { User } from "../../entities/user.entity";
import { isEmail } from "../../utils/isEmail";
import MyContext from "../../utils/MyContext";
import { validateLoginInput } from "../../utils/validateLoginInput";
import { validateRegisterInput } from "../../utils/validateRegisterInput";
import {
  ChangePasswordInput,
  EditUserInput,
  LoginInput,
  RegisterInput,
  UserResponse,
} from "./user.input";
import { UserRepository } from "./user.repository";
import { CountryRepository } from "../location/country.repo";
import { CityRepository } from "../location/city.repo";
import { v4 } from "uuid";
import { sendEmail } from "../../utils/sendEmail";
import { validateInput } from "../../utils/validateInput";

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg("data") registerData: RegisterInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const repo = UserRepository;

    const errors = await validateRegisterInput(registerData);

    if (errors.length > 0) {
      return {
        errors,
      };
    }

    // find user city and country
    const countryId = parseInt(registerData.countryId);
    const cityId = parseInt(registerData.cityId);

    const username = registerData.username;
    const email = registerData.email;
    const phone = registerData.phone;
    const hashedPassword = await argon2.hash(registerData.password);

    const country = await CountryRepository.findOne({
      where: { id: countryId },
    });
    const city = await CityRepository.findOne({ where: { id: cityId } });

    if (!country || !city) {
      return {
        errors: [
          {
            field: "location",
            message: "pays ou ville non identifié",
          },
        ],
      };
    }

    const user = new User();
    user.username = username;
    user.email = email;
    user.phone = phone;
    user.password = hashedPassword;
    user.country = country as any;
    user.city = city as any;

    try {
      await repo.insert(user);
    } catch (error) {
      console.log(error);
      if (
        error.detail.includes("username") &&
        error.detail.includes("already exists")
      ) {
        return {
          errors: [
            {
              field: "username",
              message: "Ce nom d'utilisateur existe déjà",
            },
          ],
        };
      }

      if (
        error.detail.includes("email") &&
        error.detail.includes("already exists")
      ) {
        return {
          errors: [
            {
              field: "email",
              message: "l'email existe déjà",
            },
          ],
        };
      }
    }

    // store user id in session
    req.session.userId = user.id;

    const registeredUser = await repo.findOne({
      where: { username: user.username },
      relations: {
        country: true,
        city: true,
      },
    });

    return {
      user: registeredUser as any,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Ctx() { req }: MyContext,
    @Arg("data") loginData: LoginInput
  ): Promise<UserResponse> {
    const repo = UserRepository;
    const errors = await validateLoginInput(loginData);

    if (errors.length > 0) {
      return {
        errors,
      };
    }

    // check wether user is trying to login with email
    const isEmailAddress = isEmail(loginData.usernameOrEmail);

    // check if user exists in db based on email or username
    const user = await repo.findByUsernameOrEmail(
      loginData.usernameOrEmail,
      isEmailAddress
    );

    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Nom utilisateur ou Email n'existe pas",
          },
        ],
      };
    }

    if (user) {
      // check user pwd hashed with hashed pwd in db
      const matchedPassword = await argon2.verify(
        user.password as string,
        loginData.password
      );

      // // pwds does not match
      if (!matchedPassword) {
        return {
          errors: [
            {
              field: "password",
              message: "Mot de pass incorrecte",
            },
          ],
        };
      }

      // pwds match login user
      // set user cookie
      req.session.userId = user.id;
    }

    return {
      user: user as User,
    };
  }

  @Mutation(() => User)
  async editUser(
    @Arg("userId") userId: string,
    @Arg("data") { username, email, phone, cityId }: EditUserInput
  ): Promise<User | null> {
    const repo = UserRepository;
    const replacements = [userId, username, email, phone, cityId];
    await repo.query(
      `
      UPDATE "user" set
      username=$2,
      email=$3,
      phone=$4,
      "cityId"=$5 
      WHERE id=$1;
    `,
      replacements
    );
    return repo.findOne({
      where: { id: parseInt(userId) },
      relations: { country: true, city: true },
    });
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    const repo = UserRepository;
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }

    return repo.findOne({
      where: { id: req.session.userId },
      relations: { country: true, city: true },
    });
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email", () => String) email: string,
    @Ctx() { redis }: MyContext
  ): Promise<boolean> {
    const repo = UserRepository;
    const user = await repo.findOne({ where: { email } });
    if (!user) {
      // the email is not in the database
      return true;
    }

    // send the email
    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "EX",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    // console.log('redis:',redis.get(FORGET_PASSWORD_PREFIX + token));

    // const htmlContent = `
    //   <html>
    //     <body>
    //       <h2>Cliquer sur le lien ci-dessous pour changer votre mot de pass<h2>
    //       <a href="http://localhost:3000/change-password/${token}">Réinitialiser mot de pass</a>
    //     </body>
    //   </html>
    // `;

    const htmlContent = `
      <html>
        <body>
          <h2>Cliquer sur le lien ci-dessous pour changer votre mot de pass<h2>
          <a href="https://nkasugu.com/change-password/${token}">Réinitialiser mot de pass</a>
        </body>
      </html>
    `;

    await sendEmail(email, htmlContent);

    return true;
  }
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("data", () => ChangePasswordInput) data: ChangePasswordInput,
    @Ctx() { req, redis }: MyContext
  ): Promise<UserResponse> {
    const repo = UserRepository;
    const errors = await validateInput(data);

    console.log(errors);

    if (errors.length > 0) {
      return {
        errors,
      };
    }

    const key = FORGET_PASSWORD_PREFIX + data.token;
    let userId = await redis.get(key);
    console.log("userId:", userId);

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "une erreur s'est produite",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);

    const user = await repo.findOne({
      where: { id: userIdNum },
      relations: {
        city: true,
        country: true,
      },
    });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "l'utilisateur n'existe plus",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(data.newPassword);
    await repo.update({ id: userIdNum }, { password: hashedPassword });

    await redis.del(key);

    // automatically login the user after they changed their password
    req.session.userId = user.id;

    return { user };
  }
}
