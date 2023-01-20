
import AppDataSource from '../../data-source';
import { Category } from '../../entities/category.entity';
export const CategoryRepository = AppDataSource.getRepository(Category).extend({
    // custom methods here
})