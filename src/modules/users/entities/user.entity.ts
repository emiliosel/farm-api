import { Farm } from "modules/farms/entities/farm.entity";
import { OneToMany, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  public readonly id: string;

  @Column({ unique: true })
  public email: string;

  @Column()
  public address: string;

  @OneToMany(() => Farm, farm => farm.user)
  public farms: Farm[];

  @Column("float8")
  public lat: number;

  @Column("float8")
  public long: number;

  @Column()
  public hashedPassword: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
