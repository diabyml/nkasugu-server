import { v2 as cloudinary } from "cloudinary";
import { FileUpload, GraphQLUpload } from "graphql-upload";
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import AppDataSource from "../../data-source";
import { Category } from "../../entities/category.entity";
import { Product } from "../../entities/product.entity";
import { validateInput } from "../../utils/validateInput";
import {
  AddProductInputType,
  AddProductResponse,
  EditProductInputType,
  PaginatedProducts,
  PaginatedProductsInput,
  PaginatedSearchProducts,
} from "./product.types";

import { v4 as uuidv4 } from "uuid";

import { City } from "../../entities/city.entity";
import { Image } from "../../entities/image.entity";
import { User } from "../../entities/user.entity";
import MyContext from "../../utils/MyContext";
import { slugify } from "../../utils/slugify";
import {
  updateImage,
  uploadImage,
  uploadImages,
} from "../../utils/uploadToCloudinary";
import { ProductRepository } from "./product.repo";
import { UserRepository } from "../user/user.repository";
import { getImageFromVariant } from "../../utils/getImageFromVariant";
import { isAuth } from "../../middlewares/isAuth";

@Resolver(Product)
export class ProductResolver {
  @Mutation(() => AddProductResponse)
  @UseMiddleware(isAuth)
  async addProduct(
    @Arg("image1", () => GraphQLUpload) image1: FileUpload,
    @Arg("image2", () => GraphQLUpload, { nullable: true }) image2: FileUpload,
    @Arg("image3", () => GraphQLUpload, { nullable: true }) image3: FileUpload,
    @Arg("data") data: AddProductInputType
  ): Promise<AddProductResponse> {
    const errors = await validateInput(data);

    if (errors.length > 0) {
      return {
        errors,
      };
    }

    const images: FileUpload[] = [image1];
    if (image2) {
      images.push(image2);
    }

    if (image3) {
      images.push(image3);
    }

    // store images in cloudinary
    const uploadsApiResponses = await uploadImages(images, "images/products/");

    // store product to db
    let productId;
    const getImageVariant = (image: FileUpload) => {
      if (image === image1) return "primary";
      else if (image === image2) return "secondary";
      else return "tertiary";
    };
    try {
      await AppDataSource.transaction(async (manager) => {
        // store images in db
        // const storedImages: Image[] = [];
        // for (let i = 0; i < uploadsApiResponses.length; i++) {
        //   const upload = uploadsApiResponses[i];
        //   const variant = getImageVariant(images[i]);
        //   console.log("variant:", variant);
        //   const image = manager.create(Image, {
        //     name: images[i].filename,
        //     publicId: upload.public_id,
        //     url: upload.url,
        //     secureUrl: upload.secure_url,
        //     variant: variant,
        //   });
        //   await manager.save(image);
        //   storedImages.push(image);
        // }

        const {
          name,
          price,
          description,
          userId,
          cityId,
          countryId,
          categoryId,
          subCategoryId,
        } = data;

        const category = await manager.findOne(Category, {
          where: { id: parseInt(categoryId) },
        });
        const subCategory = await manager.findOne(Category, {
          where: { id: parseInt(subCategoryId) },
        });

        // new slug
        // parent-category-name/sub-category-name/product-name-slugified
        const parentCategoryName = slugify(category?.name as string);
        const subCategoryName = slugify(subCategory?.name as string);
        const slug = `${parentCategoryName}/${subCategoryName}/${
          data.slug
        }-${uuidv4()}`;

        const product = manager.create(Product, {
          name,
          price,
          description,
          userId: parseInt(userId),
          cityId: parseInt(cityId),
          countryId: parseInt(countryId),
          slug,
          categories: [category as Category, subCategory as Category],
          // document_with_weights: name,
          // images: storedImages,
        });

        const { id } = await manager.save(product);

        // save images in db after saving product
        //  const storedImages: Image[] = [];
        for (let i = 0; i < uploadsApiResponses.length; i++) {
          const upload = uploadsApiResponses[i];
          const variant = getImageVariant(images[i]);
          console.log("variant:", variant);
          const image = manager.create(Image, {
            name: images[i].filename,
            publicId: upload.public_id,
            url: upload.url,
            secureUrl: upload.secure_url,
            variant: variant,
            productId: id,
          });
          await manager.save(image);
          //  storedImages.push(image);
        }

        await manager.update(
          Product,
          { id: id },
          {
            slug: `${parentCategoryName}/${subCategoryName}/${data.slug}-${id}`,
          }
        );
        productId = (await manager.findOne(Product, { where: { id } }))?.id;
      });
    } catch (error) {
      const ids: string[] = uploadsApiResponses.map(
        (upload) => upload.public_id
      );
      await cloudinary.api.delete_resources(ids);
      console.log("error:", error);
      return {
        errors: [
          { field: "db", message: "error occured while saving product in db" },
        ],
      };
    }

    const product = await ProductRepository.findOne({
      where: { id: productId },
    });
    return { product: product as Product };
  }

  @Mutation(() => Product)
  @UseMiddleware(isAuth)
  async editProduct(
    @Arg("image1", () => GraphQLUpload, { nullable: true }) image1: FileUpload,
    @Arg("image2", () => GraphQLUpload, { nullable: true }) image2: FileUpload,
    @Arg("image3", () => GraphQLUpload, { nullable: true }) image3: FileUpload,
    @Arg("data")
    {
      productId,
      name,
      price,
      description,
      slug,
      productImagesIds: productImages,
    }: EditProductInputType
  ): Promise<Product | null> {
    const repo = ProductRepository;
    let imagesChanged = image1 || image2 || image3;
    let productChanged = name || price || description || slug;

    // nothing was changed
    if (!imagesChanged && !productChanged) {
      console.log("nothing was changed");
      return await repo.findOne({
        where: { id: parseInt(productId) },
        relations: { images: true },
      });
    }

    // update image if changed or add if image2 or image3 not already set
    const existingImages = JSON.parse(productImages);

    if (image1) {
      // new image provided for image1 so update
      const image1PublicId = getImageFromVariant(
        existingImages,
        "primary"
      )?.publicId;
      // console.log("::public id:", );
      const { secure_url, url } = await updateImage(image1, image1PublicId);
      // console.log("update response:", updateResponse);
      await repo
        .createQueryBuilder()
        .update(Image)
        .set({
          secureUrl: secure_url + "?" + uuidv4(),
          url: url + "?" + uuidv4(),
        })
        .where(`"publicId" = :imagePublicId`, { imagePublicId: image1PublicId })
        .execute();
    }

    // by updating image2 the order get messed up
    if (image2) {
      // console.log("image2 provided");
      // image 2 provided
      if (existingImages.length > 1) {
        // image2 already exists, it needs to be updated
        // console.log("image2 needs to be updated");
        const image2PublicId = getImageFromVariant(
          existingImages,
          "secondary"
        )?.publicId;
        // console.log("::public id:", image2PublicId);
        const { secure_url, url } = await updateImage(image2, image2PublicId);
        await repo
          .createQueryBuilder()
          .update(Image)
          .set({
            secureUrl: secure_url + "?" + uuidv4(),
            url: url + "?" + uuidv4(),
          })
          .where(`"publicId" = :publicId`, { publicId: image2PublicId })
          .execute();
      } else {
        // console.log("image2 needs to be added");
        // image2 does not exists add new image
        const response = await uploadImage(image2, "images/products/");
        const imageRepo = AppDataSource.getRepository(Image);
        const image = imageRepo.create({
          name: image2.filename,
          publicId: response.public_id,
          url: response.url,
          secureUrl: response.secure_url,
          productId: parseInt(productId),
          variant: "secondary",
        });
        await imageRepo.save(image);
      }
    }

    if (image3) {
      // console.log("image2 provided");
      // image 2 provided
      if (existingImages.length > 2) {
        // image2 already exists, it needs to be updated
        // console.log("image2 needs to be updated");
        const image3PublicId = getImageFromVariant(
          existingImages,
          "tertiary"
        )?.publicId;
        // console.log("::public id:", image2PublicId);
        const { secure_url, url } = await updateImage(image3, image3PublicId);
        await repo
          .createQueryBuilder()
          .update(Image)
          .set({
            secureUrl: secure_url + "?" + uuidv4(),
            url: url + "?" + uuidv4(),
          })
          .where(`"publicId" = :publicId`, { publicId: image3PublicId })
          .execute();
      } else {
        // console.log("image2 needs to be added");
        // image2 does not exists add new image
        const response = await uploadImage(image3, "images/products/");
        const imageRepo = AppDataSource.getRepository(Image);
        const image = imageRepo.create({
          name: image3.filename,
          publicId: response.public_id,
          url: response.url,
          secureUrl: response.secure_url,
          productId: parseInt(productId),
          variant: "tertiary",
        });
        await imageRepo.save(image);
      }
    }

    // product info changed
    if (productChanged) {
      const query = repo.createQueryBuilder().update(Product);
      let newProductObject = {} as any;
      if (name) newProductObject.name = name;
      if (price) newProductObject.price = price;
      if (description) newProductObject.description = description;
      if (slug) newProductObject.slug = slug;

      query.set(newProductObject);
      query.where("id = :productId", { productId: productId });
      await query.execute();
    }

    // return updated product
    // return await repo
    //   .createQueryBuilder("product")
    //   .leftJoinAndSelect("product.images", "image")
    //   .orderBy(`image."createdAt"`, "ASC")
    //   .getOne();

    return await repo.findOne({
      where: { id: parseInt(productId) },
      relations: { images: true },
    });
  }

  @Query(() => PaginatedProducts)
  async products(
    @Arg("categoryId", () => String, {
      nullable: true,
    })
    categoryId: string,
    @Arg("username", () => String, {
      nullable: true,
    })
    username: string,
    @Arg("data")
    { cursor, limit, countryId }: PaginatedProductsInput
  ): Promise<PaginatedProducts> {
    const repo = ProductRepository;
    let parsedCursor = cursor ? new Date(parseInt(cursor)) : null;

    const realLimit = Math.min(50, limit);
    const reaLimitPlusOne = realLimit + 1;

    // test products with username

    let query = repo
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.images", "image");

    // if user wants products of a specific category, categoryId will be true
    if (categoryId) {
      query
        .leftJoin("product.categories", "category")
        .where('product_category."categoryId" = :categoryId', {
          categoryId: categoryId,
        });
    }

    // if username provided get products of that user only
    if (username) {
      const user = await UserRepository.findOne({
        where: { username: username },
      });
      // console.log("product-resolver user::", user);
      query.andWhere('product."userId" = :userId', { userId: user?.id });
    }

    query
      .andWhere(`product."countryId" = :countryId`, { countryId: countryId })
      .orderBy("product.createdAt", "DESC")
      .take(reaLimitPlusOne);

    if (parsedCursor) {
      query.andWhere(`product."createdAt" < :cursor`, {
        cursor: parsedCursor,
      });
    }

    let products = await query.getMany();

    // const productCategories = await CategoryRepository.query(
    //   "select * from product_categories_category where id = $1;", [product.]
    // );
    // console.log("res::", productCategories);

    return {
      hasMore: products.length === reaLimitPlusOne,
      data: products.slice(0, realLimit),
    };
  }

  @Query(() => Product)
  async product(
    @Arg("slug", () => String, { nullable: true }) slug: string,
    @Arg("id", () => String, { nullable: true }) id: string
  ): Promise<Product | null> {
    const repo = ProductRepository;

    if (slug) {
      return await repo.findOne({
        where: { slug: slug },
        relations: { images: true },
      });
    } else {
      return await repo.findOne({
        where: { id: parseInt(id) },
        relations: { images: true },
      });
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleProduct(@Arg("id") id: string): Promise<boolean> {
    await AppDataSource.transaction(async (manager) => {
      const images = await manager.find(Image, {
        where: { productId: parseInt(id) },
      });
      await cloudinary.api.delete_resources(
        images.map((image) => image.publicId)
      );
      manager.delete(Product, id);
    });
    return true;
  }

  // @Query(() => [Product])
  // async search(
  //   @Arg("query") query: string,
  //   @Arg("countryId") countryId: string
  // ): Promise<Product[]> {
  //   const repo = ProductRepository;
  //   return await repo
  //     .createQueryBuilder("p")
  //     .select()
  //     .leftJoinAndSelect("p.images", "image")
  //     .where("document_with_weights @@ plainto_tsquery(:query)", {
  //       query: query,
  //     })
  //     .andWhere(`p."countryId" = :countryId`, { countryId: countryId })
  //     .orderBy(
  //       "ts_rank(document_with_weights, plainto_tsquery(:query))",
  //       "DESC"
  //     )
  //     .getMany();
  // }

  @Query(() => PaginatedSearchProducts)
  async paginatedSearch(
    @Arg("query") query: string,
    @Arg("countryId") countryId: string,
    @Arg("skip", () => Int, { nullable: true }) skip: number,
    @Arg("limit", () => Int, { nullable: true, defaultValue: 50 }) limit: number
  ): Promise<PaginatedSearchProducts> {
    const repo = ProductRepository;
    const realLimit = Math.min(50, limit);
    const reaLimitPlusOne = realLimit + 1;

    const qb = repo
      .createQueryBuilder("p")
      .select()
      .leftJoinAndSelect("p.images", "image")
      .where("document_with_weights @@ plainto_tsquery(:query)", {
        query: query,
      })
      .andWhere(`p."countryId" = :countryId`, { countryId: countryId });

    if (skip) {
      qb.skip(skip);
    }

    // qb.orderBy(
    //   "ts_rank(document_with_weights, plainto_tsquery(:query))",
    //   "DESC"
    // );

    qb.take(reaLimitPlusOne);
    const data = await qb.getMany();

    console.log("search data:", data);
    console.log("real limit plus one:", reaLimitPlusOne);

    return {
      data: data.slice(0, realLimit),
      hasMore: data.length === reaLimitPlusOne,
    };
  }

  @Query(() => [Product])
  async search(
    @Arg("query") query: string,
    @Arg("countryId") countryId: string
  ): Promise<Product[]> {
    const repo = ProductRepository;
    return await repo
      .createQueryBuilder("p")
      .select()
      .leftJoinAndSelect("p.images", "image")
      .where("document_with_weights @@ plainto_tsquery(:query)", {
        query: query,
      })
      .andWhere(`p."countryId" = :countryId`, { countryId: countryId })
      .orderBy(
        "ts_rank(document_with_weights, plainto_tsquery(:query))",
        "DESC"
      )
      .getMany();
  }

  @FieldResolver(() => User)
  user(@Root() product: Product, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(product.userId);
  }

  @FieldResolver(() => City)
  city(@Root() product: Product, @Ctx() { cityLoader }: MyContext) {
    return cityLoader.load(product.cityId);
  }

  @FieldResolver(() => City)
  country(@Root() product: Product, @Ctx() { countryLoader }: MyContext) {
    return countryLoader.load(product.countryId);
  }
}
