import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, BeforeInsert } from 'typeorm';
import { Branch } from '../../branches/entities/Branch';
import { EmployeeSession } from '../../auth/entities/EmployeeSession';
import bcrypt from 'bcryptjs';

export enum EmployeeRole {
  JUNIOR = 'junior',
  SENIOR = 'senior',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ type: 'enum', enum: EmployeeRole })
  role: EmployeeRole;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'current_branch_id' })
  currentBranch: Branch;

  @Column({ name: 'current_branch_id', nullable: true })
  currentBranchId: string;

  @OneToMany(() => EmployeeSession, session => session.employee)
  sessions: EmployeeSession[];

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    }
  }
}
