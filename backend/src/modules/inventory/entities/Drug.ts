import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DrugBatch } from './DrugBatch';

@Entity('drugs')
export class Drug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand: string;

  @Column()
  company: string;

  @Column({ name: 'entering_date', type: 'date' })
  enteringDate: Date;

  @Column({ name: 'last_price_update_date', type: 'timestamp', nullable: true })
  lastPriceUpdateDate: Date;

  @OneToMany(() => DrugBatch, batch => batch.drug)
  batches: DrugBatch[];
}
