import {MigrationInterface, QueryRunner} from 'typeorm';

export class EmployeeIsActive1735776000000 implements MigrationInterface {
    name = 'EmployeeIsActive1735776000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE employees
            ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE employees DROP COLUMN IF EXISTS is_active
        `);
    }
}
