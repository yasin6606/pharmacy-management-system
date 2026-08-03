import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, VersionColumn } from 'typeorm';
import { Drug } from './Drug';
import { Branch } from '../../branches/entities/Branch';

@Entity('drug_batches')
export class DrugBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Drug)
  @JoinColumn({ name: 'drug_id' })
  drug: Drug;

  @Column({ name: 'drug_id' })
  drugId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'expiration_date', type: 'date' })
  expirationDate: Date;

  @Column({ type: 'int', default: 0 })
  count: number;

  @Column({ name: 'is_offer', default: false })
  isOffer: boolean;

  @Column({ name: 'exchanged_quantity', default: 0 })
  exchangedQuantity: number;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePrice: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  sellingPrice: number;

  @VersionColumn()
  version: number;
}
