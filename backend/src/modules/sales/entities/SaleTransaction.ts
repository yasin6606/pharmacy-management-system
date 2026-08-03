import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn} from 'typeorm';
import {DrugBatch} from '../../inventory/entities/DrugBatch';
import {Employee} from '../../employees/entities/Employee';
import {Branch} from '../../branches/entities/Branch';

@Entity('sales_transactions')
export class SaleTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => DrugBatch)
    @JoinColumn({name: 'drug_batch_id'})
    drugBatch: DrugBatch;

    @Column({name: 'drug_batch_id'})
    drugBatchId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({name: 'employee_id'})
    employee: Employee;

    @Column({name: 'employee_id'})
    employeeId: string;

    @ManyToOne(() => Branch)
    @JoinColumn({name: 'branch_id'})
    branch: Branch;

    @Column({name: 'branch_id'})
    branchId: string;

    @Column({type: 'int'})
    quantity: number;

    @Column({name: 'unit_price', type: 'decimal', precision: 10, scale: 2, transformer: {from: parseFloat, to: Number}})
    unitPrice: number;

    @Column({
        name: 'total_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        transformer: {from: parseFloat, to: Number}
    })
    totalPrice: number;

    @CreateDateColumn({name: 'sold_date'})
    soldDate: Date;

    @Column({name: 'is_offer_sale', default: false})
    isOfferSale: boolean;

    @Column({name: 'is_exchange', default: false})
    isExchange: boolean;

    @Column({name: 'prescription_ref', nullable: true})
    prescriptionRef: string;

    @Column({name: 'basket_id', type: 'uuid', nullable: true})
    basketId: string | null;

    @Column({
        name: 'franchise_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {from: parseFloat, to: Number}
    })

    franchiseFee: number;

    @Column({type: 'enum', enum: ['cash', 'transfer', 'pos', 'credit'], default: 'cash'})
    paymentMethod: 'cash' | 'transfer' | 'pos' | 'credit';

    @Column({name: 'customer_name', nullable: true})
    customerName: string;

    @Column({name: 'customer_family', nullable: true})
    customerFamily: string;

    @Column({name: 'customer_phone', nullable: true})
    customerPhone: string;

    @Column({name: 'pos_reference', nullable: true})
    posReference: string;   // bank transaction ID

    @Column({ name: 'is_paid', default: false })
    isPaid: boolean;
}
