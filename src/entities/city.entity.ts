import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Country } from "./country.entity";
import { Product } from "./product.entity";
import { User } from './user.entity';

@ObjectType()
@Entity()
export class City {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ nullable: false })
  name: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Country, (country) => country.cities)
  country: Country;

  // @Field(() => [Product] )
  @OneToMany( () => Product, (product) => product.city)
  products: Product[];

  // @Field(() => [User])
  @OneToMany(() => User, (user) => user.city )
  users: User[];
}
