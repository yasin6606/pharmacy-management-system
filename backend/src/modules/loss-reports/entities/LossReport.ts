import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '../../employees/entities/Employee';
import { Branch } from '../../branches/entities/Branch';
import { Drug } from '../../inventory/entities/Drug';

export enum LossReportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('loss_reports')
export class LossReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'reported_by' })
  reportedBy: Employee;

  @Column({ name: 'reported_by' })
  reportedById: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Drug)
  @JoinColumn({ name: 'drug_id' })
  drug: Drug;

  @Column({ name: 'drug_id' })
  drugId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'enum', enum: LossReportStatus, default: LossReportStatus.PENDING })
  status: LossReportStatus;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: Employee;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedById: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
