import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Supplier } from './Supplier';
import { Employee } from '../../employees/entities/Employee';
import { Branch } from '../../branches/entities/Branch';

@Entity('purchase_orders')
export class PurchaseOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Supplier)
    @JoinColumn({ name: 'supplier_id' })
    supplier: Supplier;

    @Column({ name: 'supplier_id' })
    supplierId: string;

    @ManyToOne(() => Branch)
    @JoinColumn({ name: 'branch_id' })
    branch: Branch;

    @Column({ name: 'branch_id' })
    branchId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'created_by' })
    createdBy: Employee;

    @Column({ name: 'created_by' })
    createdById: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    items: any; // Could be normalized further

    @Column({ name: 'invoice_image_url', nullable: true })
    invoiceImageUrl: string;
}
