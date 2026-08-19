import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({name: 'first_name'})
    firstName: string;

    @Column({name: 'last_name'})
    lastName: string;

    @Index()
    @Column({type: 'varchar', nullable: true})
    phone: string | null;

    @Column({type: 'varchar', nullable: true})
    nationalId: string | null;

    /** Known allergies free text (checked at sale) */
    @Column({type: 'text', nullable: true})
    allergies: string | null;

    @Column({name: 'default_insurance_provider', type: 'varchar', nullable: true})
    defaultInsuranceProvider: string | null;

    @Column({name: 'default_insurance_member_id', type: 'varchar', nullable: true})
    defaultInsuranceMemberId: string | null;

    @Column({type: 'text', nullable: true})
    notes: string | null;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;
}
