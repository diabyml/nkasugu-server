import AppDataSource from '../../data-source';
import { User } from '../../entities/user.entity';

export const UserRepository = AppDataSource.getRepository(User).extend({
    // custom methods here
    async findByUsernameOrEmail(usernameOrEmail: string, isEmail: boolean) {
        return this.findOne({
          where: isEmail
            ? { email: usernameOrEmail }
            : { username: usernameOrEmail },
          relations: {
            country: true,
            city: true,
          }
        });
      },
});