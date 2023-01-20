import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Category } from "../../entities/category.entity";
import { AddCategoryInput } from "./category.types";
import { CategoryRepository } from "./category.repo";
import { validateInput } from "../../utils/validateInput";
import { ILike } from "typeorm";
import { isAuth } from "../../middlewares/isAuth";

@Resolver()
export class CategoryResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async addCategory(@Arg("data") data: AddCategoryInput): Promise<boolean> {
    const repo = CategoryRepository;
    const errors = await validateInput(data);

    if (errors.length > 0) {
      // return JSON.stringify(errors);
      return false;
    }

    // const { name, description, parentId } = data;
    const { categoryOrCategories, parentId } = data;

    const categories = categoryOrCategories.split(",").map((str) => {
      const cat = new Category();
      cat.name = str;
      if (parentId) {
        cat.parentId = parseInt(parentId);
      }
      return cat;
    });

    await repo.save(categories);

    // console.log('categories:');
    // categories.forEach(cat => {
    //   console.log('    ',cat);
    // })

    // newCategory.name = name;

    // if (description) {
    //   newCategory.description = data.description;
    // }

    // if (parentId) {
    //   newCategory.parentId = parseInt(data.parentId as string);
    // }

    // await repo.save(newCategory);
    // return newCategory;
    return true;
  }

  @Query(() => [Category])
  async categories(
    @Arg("parentId", () => String, { nullable: true }) parentId: string
  ) {
    const repo = CategoryRepository;

    // setTimeout( () => {
    //   console.log('waiting...')
    // } ,1000 * 100)

    if (parentId) {
      return await repo.find({ where: { parentId: parseInt(parentId) } });
    }

    return await repo.query('select * from category where "parentId" is NULL;');
  }

  @Query(() => Category)
  async getCategory(
    @Arg("categoryName") categoryName: string
  ): Promise<Category | null> {
    const formatedCategory = categoryName
      .split("-")
      .reduce((prev, curr) => prev + " " + curr);

    console.log("formated Cat:", formatedCategory);

    const result = await CategoryRepository.findOneBy({
      name: ILike(formatedCategory),
    });
    console.log("result:", result);
    return result;
  }
}
