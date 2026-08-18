import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from 'typeorm';
import {DrugBatch} from './DrugBatch';

@Entity('drugs')
export class Drug {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({nullable: true, type: 'varchar'})
    brand: string | null;

    @Column()
    company: string;

    @Column({name: 'entering_date', type: 'date'})
    enteringDate: Date;

    @Column({name: 'last_price_update_date', type: 'timestamp', nullable: true})
    lastPriceUpdateDate: Date | null;

    /** External code used when calling Titak price API */
    @Column({name: 'titak_code', type: 'varchar', nullable: true})
    titakCode: string | null;

    /** When false, line is never covered by social/insurance payers */
    @Column({name: 'insurance_eligible', type: 'boolean', default: false})
    insuranceEligible: boolean;

    /** Optional national / formulary code for insurer claims */
    @Column({name: 'insurance_code', type: 'varchar', nullable: true})
    insuranceCode: string | null;

    @OneToMany(() => DrugBatch, (batch) => batch.drug)
    batches: DrugBatch[];
}
