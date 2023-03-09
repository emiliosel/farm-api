import { MigrationInterface, QueryRunner } from "typeorm"

export class AddressCoordinateFields1678381438373 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "address" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "lat" float8 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "long" float8 NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lat"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "long"`);
    }

}
