import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import {Customer} from '../../customers/entities/Customer';
import {Employee} from '../../employees/entities/Employee';
import {Branch} from '../../branches/entities/Branch';

@Entity('prescriptions')
export class Prescription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** External / booklet reference */
    @Column({name: 'external_ref', type: 'varchar', nullable: true})
    externalRef: string | null;

    @Column({name: 'doctor_name', type: 'varchar', nullable: true})
    doctorName: string | null;

    @Column({name: 'doctor_license', type: 'varchar', nullable: true})
    doctorLicense: string | null;

    @Column({name: 'issued_at', type: 'date', nullable: true})
    issuedAt: Date | null;

    @ManyToOne(() => Customer, {nullable: true})
    @JoinColumn({name: 'customer_id'})
    customer: Customer | null;

    @Column({name: 'customer_id', nullable: true})
    customerId: string | null;

    @ManyToOne(() => Branch)
    @JoinColumn({name: 'branch_id'})
    branch: Branch;

    @Column({name: 'branch_id'})
    branchId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({name: 'recorded_by'})
    recordedBy: Employee;

    @Column({name: 'recorded_by'})
    recordedById: string;

    /** Structured lines: [{drugName, dosage, quantity, notes}] */
    @Column({type: 'jsonb', default: []})
    lines: Array<{drugName?: string; dosage?: string; quantity?: number; notes?: string}>;

    @Column({type: 'text', nullable: true})
    notes: string | null;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;
}
