import {Entity, PrimaryGeneratedColumn, Column, Unique} from 'typeorm';

/**
 * Sequential faktur / official invoice numbers per branch and calendar year.
 * Iranian pharmacies often need continuous numbering for tax/reporting.
 */
@Entity('invoice_sequences')
@Unique(['branchId', 'year'])
export class InvoiceSequence {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({name: 'branch_id'})
    branchId: string;

    @Column({type: 'int'})
    year: number;

    @Column({name: 'last_number', type: 'int', default: 0})
    lastNumber: number;

    /** Optional prefix e.g. INV-1404- */
    @Column({type: 'varchar', nullable: true})
    prefix: string | null;
}
