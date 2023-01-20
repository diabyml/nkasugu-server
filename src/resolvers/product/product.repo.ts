import AppDataSource from "../../data-source";
import { Product } from "../../entities/product.entity";

export const ProductRepository = AppDataSource.getRepository(Product).extend({
  // custom
});
