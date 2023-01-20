import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { City } from "./city.entity";
import { User } from "./user.entity";
import { Product } from "./product.entity";

@ObjectType()
@Entity()
export class Country {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true, nullable: false })
  code: string;

  @Field()
  @Column({ unique: true, nullable: false })
  name: string;

  // @Field()
  // @Column({ unique: true, nullable: true })
  // ip: string;

  @Field(() => String)
  @Column()
  phoneCode: string;

  @Field(() => String)
  @Column({ nullable: true })
  flag?: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [City])
  @OneToMany(() => City, (city) => city.country)
  cities: City[];

  @Field(() => [User])
  @OneToMany(() => User, (user) => user.country)
  users: User[];

  @OneToMany(() => Product, (product) => product.country)
  products: Product[];
}
