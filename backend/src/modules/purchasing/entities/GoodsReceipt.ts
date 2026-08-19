import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import {PurchaseOrder} from './PurchaseOrder';
import {Employee} from '../../employees/entities/Employee';
import {Branch} from '../../branches/entities/Branch';

@Entity('goods_receipts')
export class GoodsReceipt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => PurchaseOrder, {nullable: true})
    @JoinColumn({name: 'purchase_order_id'})
    purchaseOrder: PurchaseOrder | null;

    @Column({name: 'purchase_order_id', nullable: true})
    purchaseOrderId: string | null;

    @ManyToOne(() => Branch)
    @JoinColumn({name: 'branch_id'})
    branch: Branch;

    @Column({name: 'branch_id'})
    branchId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({name: 'received_by'})
    receivedBy: Employee;

    @Column({name: 'received_by'})
    receivedById: string;

    /**
     * Lines received:
     * [{ drugId, quantity, purchasePrice, sellingPrice?, expirationDate, batchNote? }]
     */
    @Column({type: 'jsonb', default: []})
    lines: Array<{
        drugId: string;
        quantity: number;
        purchasePrice: number;
        sellingPrice?: number;
        expirationDate: string;
        batchNote?: string;
    }>;

    @Column({type: 'text', nullable: true})
    notes: string | null;

    @CreateDateColumn({name: 'received_at'})
    receivedAt: Date;
}
