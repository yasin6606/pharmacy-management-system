import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Employee } from '../../employees/entities/Employee';
import { DrugBatch } from '../../inventory/entities/DrugBatch';
import { SaleTransaction } from '../../sales/entities/SaleTransaction';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'is_warehouse', default: false })
  isWarehouse: boolean;

  @OneToMany(() => Employee, employee => employee.currentBranch)
  employees: Employee[];

  @OneToMany(() => DrugBatch, batch => batch.branch)
  drugBatches: DrugBatch[];

  @OneToMany(() => SaleTransaction, sale => sale.branch)
  sales: SaleTransaction[];

  @Column({ name: 'has_franchise', default: false })
  hasFranchise: boolean;
}
