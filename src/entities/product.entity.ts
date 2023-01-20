import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./category.entity";
import { City } from "./city.entity";
import { User } from "./user.entity";
import { Image } from "./image.entity";
import { Country } from "./country.entity";

@ObjectType()
@Entity({ name: "product" })
export class Product {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String, { nullable: false })
  @Column({ nullable: false, unique: true })
  slug: string;

  @Field()
  @Column({ nullable: false })
  name: string;

  @Field(() => String, { nullable: true })
  @Column("text", { nullable: true })
  description?: string;

  @Field(() => String)
  @Column({ nullable: false })
  price: string;

  @Field(() => Boolean)
  @Column("bool", { default: false })
  shippeable: boolean;

  @Field(() => Boolean)
  @Column("bool", { default: false })
  isSold: boolean;

  @Column("tsvector", { select: false })
  document_with_weights: any;

  @Field()
  @Column()
  cityId: number;

  @Field()
  @Column()
  countryId: number;

  @Field()
  @Column()
  userId: number;

  // relations
  // (user) (category) city image

  @Field(() => [Image])
  @OneToMany(() => Image, (image) => image.product)
  images: Image[];

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.products, { onDelete: "CASCADE" })
  user: User;

  @Field(() => City)
  @ManyToOne(() => City, (city) => city.products)
  city: City;

  @Field(() => Country)
  @ManyToOne(() => Country, (country) => country.products)
  country: Country;

  @Field(() => [Category])
  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
