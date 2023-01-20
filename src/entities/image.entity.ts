import { Field, ID, ObjectType } from "type-graphql";

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Product } from "./product.entity";

@ObjectType()
@Entity()
export class Image {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ nullable: false })
  name: string;

  @Field(() => String)
  @Column({ nullable: false })
  publicId: string;

  @Field(() => String)
  @Column({ nullable: false })
  secureUrl: string;

  @Field(() => String)
  @Column({ nullable: false })
  url: string;

  @Field(() => String)
  @Column({ nullable: false })
  variant: string;

  //   relations
  // product

  @Field()
  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: "CASCADE",
  })
  product: Product;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
