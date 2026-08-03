import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { DrugBatch } from './DrugBatch';
import { Branch } from '../../branches/entities/Branch';
import { Employee } from '../../employees/entities/Employee';

export enum MovementType {
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  SALE = 'sale',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DrugBatch)
  @JoinColumn({ name: 'drug_batch_id' })
  drugBatch: DrugBatch;

  @Column({ name: 'drug_batch_id' })
  drugBatchId: string;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'from_branch_id' })
  fromBranch: Branch;

  @Column({ name: 'from_branch_id', nullable: true })
  fromBranchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'to_branch_id' })
  toBranch: Branch;

  @Column({ name: 'to_branch_id', nullable: true })
  toBranchId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'performed_by' })
  performedBy: Employee;

  @Column({ name: 'performed_by' })
  performedById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ nullable: true })
  note: string;
}
