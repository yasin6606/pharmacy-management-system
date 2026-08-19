import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import {Employee} from '../../employees/entities/Employee';
import {Branch} from '../../branches/entities/Branch';

@Entity('cash_shifts')
export class CashShift {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Branch)
    @JoinColumn({name: 'branch_id'})
    branch: Branch;

    @Column({name: 'branch_id'})
    branchId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({name: 'opened_by'})
    openedBy: Employee;

    @Column({name: 'opened_by'})
    openedById: string;

    @Column({name: 'closed_by', type: 'uuid', nullable: true})
    closedById: string | null;

    @CreateDateColumn({name: 'opened_at'})
    openedAt: Date;

    @Column({name: 'closed_at', type: 'timestamp', nullable: true})
    closedAt: Date | null;

    @Column({
        name: 'opening_float',
        type: 'decimal',
        precision: 18,
        scale: 0,
        default: 0,
        transformer: {from: parseFloat, to: Number},
    })
    openingFloat: number;

    @Column({
        name: 'closing_cash_counted',
        type: 'decimal',
        precision: 18,
        scale: 0,
        nullable: true,
        transformer: {from: parseFloat, to: Number},
    })
    closingCashCounted: number | null;

    @Column({
        name: 'expected_cash',
        type: 'decimal',
        precision: 18,
        scale: 0,
        nullable: true,
        transformer: {from: parseFloat, to: Number},
    })
    expectedCash: number | null;

    @Column({
        name: 'variance',
        type: 'decimal',
        precision: 18,
        scale: 0,
        nullable: true,
        transformer: {from: parseFloat, to: Number},
    })
    variance: number | null;

    @Column({type: 'text', nullable: true})
    notes: string | null;

    @Column({type: 'varchar', default: 'open'})
    status: 'open' | 'closed';
}
