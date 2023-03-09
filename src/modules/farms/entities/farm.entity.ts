import { User } from "modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Farm {
  @PrimaryGeneratedColumn("uuid")
  public readonly id: string;

  @Column()
  public name: string;

  @Column()
  public address: string;

  @ManyToOne(() => User, user => user.farms)
  public user: User;

  @Column("float")
  public size: number;

  @Column("float")
  public yield: number;

  @Column("float8")
  public lat: number;

  @Column("float8")
  public long: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

}
