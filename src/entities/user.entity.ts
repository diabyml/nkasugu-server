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

import { City } from "./city.entity";
import { Country } from "./country.entity";
import { Product } from "./product.entity";

@ObjectType()
@Entity()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ unique: true, nullable: false })
  username: string;

  @Field()
  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Field()
  @Column({ nullable: false, default: "user" })
  role: string;

  @Field(() => String)
  @Column()
  phone: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Country)
  @ManyToOne(() => Country, (country) => country.users)
  country: Country;

  @Field(() => City)
  @ManyToOne(() => City, (city) => city.users)
  city: City;

  // @Field(() => [Product])
  @OneToMany(() => Product, (product) => product.user)
  products: Product[];
}
