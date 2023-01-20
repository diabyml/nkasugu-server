import { Field, ID, ObjectType } from "type-graphql";
import {
    Column,
    CreateDateColumn,
    Entity, PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";


@ObjectType()
@Entity()
export class Category {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String, { nullable: false })
  @Column({ nullable: false, unique: true })
  name: string;

//   one to one relation
  @Field(() => ID, { nullable: true})
  @Column( { nullable: true} )
  parentId?: number;

  @Field(() => String, { nullable: true })
  @Column({type:'text',nullable: true})
  description?: string;


  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
