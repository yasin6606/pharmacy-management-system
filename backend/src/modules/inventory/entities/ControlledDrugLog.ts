import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import {Drug} from './Drug';
import {Employee} from '../../employees/entities/Employee';
import {Branch} from '../../branches/entities/Branch';

@Entity('controlled_drug_logs')
export class ControlledDrugLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Drug)
    @JoinColumn({name: 'drug_id'})
    drug: Drug;

    @Column({name: 'drug_id'})
    drugId: string;

    @ManyToOne(() => Branch)
    @JoinColumn({name: 'branch_id'})
    branch: Branch;

    @Column({name: 'branch_id'})
    branchId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({name: 'dispensed_by'})
    dispensedBy: Employee;

    @Column({name: 'dispensed_by'})
    dispensedById: string;

    @Column({type: 'int'})
    quantity: number;

    @Column({name: 'patient_name', type: 'varchar', nullable: true})
    patientName: string | null;

    @Column({name: 'prescription_ref', type: 'varchar', nullable: true})
    prescriptionRef: string | null;

    @Column({name: 'sale_id', type: 'uuid', nullable: true})
    saleId: string | null;

    @Column({type: 'text', nullable: true})
    notes: string | null;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;
}
