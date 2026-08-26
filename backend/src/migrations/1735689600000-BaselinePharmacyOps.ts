import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * Baseline / additive migration for pharmacy ops features and IRR scale alignment.
 * Safe to run on DBs that already have core tables: uses IF NOT EXISTS / conditional ALTERs.
 */
export class BaselinePharmacyOps1735689600000 implements MigrationInterface {
    name = 'BaselinePharmacyOps1735689600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

        // Drug catalog extensions
        await queryRunner.query(`
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS barcode varchar NULL;
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS is_controlled boolean NOT NULL DEFAULT false;
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS min_stock_level int NOT NULL DEFAULT 0;
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS notes text NULL;
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS titak_code varchar NULL;
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS insurance_eligible boolean NOT NULL DEFAULT false;
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS insurance_code varchar NULL;
            ALTER TABLE drugs ADD COLUMN IF NOT EXISTS last_price_update_date timestamp NULL;
        `);

        // IRR: whole rials (best-effort; ignore if type already matches)
        await queryRunner.query(`
            DO $$ BEGIN
              ALTER TABLE drug_batches
                ALTER COLUMN purchase_price TYPE numeric(18,0),
                ALTER COLUMN selling_price TYPE numeric(18,0);
            EXCEPTION WHEN others THEN NULL;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS customers (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              first_name varchar NOT NULL,
              last_name varchar NOT NULL,
              phone varchar NULL,
              national_id varchar NULL,
              insurance_provider varchar NULL,
              insurance_member_id varchar NULL,
              notes text NULL,
              created_at TIMESTAMP NOT NULL DEFAULT now(),
              updated_at TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS employee_sessions (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              employee_id uuid NOT NULL,
              login_time TIMESTAMP NOT NULL DEFAULT now(),
              logout_time TIMESTAMP NULL,
              ip_address varchar NULL
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS cash_shifts (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              branch_id uuid NOT NULL,
              opened_by_id uuid NOT NULL,
              closed_by_id uuid NULL,
              opened_at TIMESTAMP NOT NULL DEFAULT now(),
              closed_at TIMESTAMP NULL,
              opening_float numeric(18,0) NOT NULL DEFAULT 0,
              closing_cash_counted numeric(18,0) NULL,
              expected_cash numeric(18,0) NULL,
              variance numeric(18,0) NULL,
              notes text NULL,
              status varchar NOT NULL DEFAULT 'open'
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              actor_id uuid NULL,
              actor_email varchar NULL,
              action varchar NOT NULL,
              entity_type varchar NULL,
              entity_id varchar NULL,
              metadata jsonb NULL,
              ip_address varchar NULL,
              created_at TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS controlled_drug_logs (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              drug_id uuid NOT NULL,
              branch_id uuid NOT NULL,
              dispensed_by_id uuid NOT NULL,
              quantity int NOT NULL,
              patient_name varchar NULL,
              prescription_ref varchar NULL,
              sale_id uuid NULL,
              notes text NULL,
              created_at TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS integration_settings (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              key varchar NOT NULL UNIQUE,
              value text NOT NULL DEFAULT ''
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS invoice_sequences (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              branch_id uuid NOT NULL,
              year int NOT NULL,
              last_number int NOT NULL DEFAULT 0,
              prefix varchar NULL,
              UNIQUE(branch_id, year)
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS notification_outbox (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              channel varchar NOT NULL,
              recipient varchar NOT NULL,
              body text NOT NULL,
              purpose varchar NULL,
              metadata jsonb NULL,
              status varchar NOT NULL DEFAULT 'pending',
              error_message text NULL,
              created_at TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        // Sales insurance columns (best-effort)
        await queryRunner.query(`
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS insurance_provider varchar(32) NOT NULL DEFAULT 'none';
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS insurance_member_id varchar NULL;
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS insurance_coverage_amount numeric(18,0) NOT NULL DEFAULT 0;
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS patient_share_amount numeric(18,0) NOT NULL DEFAULT 0;
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS basket_id uuid NULL;
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS franchise_fee numeric(18,0) NOT NULL DEFAULT 0;
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS pos_reference varchar NULL;
            ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Non-destructive down: leave data tables in place (ops safety)
        await queryRunner.query(`SELECT 1`);
    }
}
