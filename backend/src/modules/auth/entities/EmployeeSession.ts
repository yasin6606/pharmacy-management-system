import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '../../employees/entities/Employee';

@Entity('employee_sessions')
export class EmployeeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @CreateDateColumn({ name: 'login_time' })
  loginTime: Date;

  @Column({ name: 'logout_time', type: 'timestamp', nullable: true })
  logoutTime: Date | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;
}
