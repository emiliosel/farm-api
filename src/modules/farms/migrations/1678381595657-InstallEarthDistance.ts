import { MigrationInterface, QueryRunner } from "typeorm"

export class InstallEarthDistance1678381595657 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS cube`);
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS earthdistance`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP EXTENSION IF EXISTS cube`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS earthdistance`);
    }

}
