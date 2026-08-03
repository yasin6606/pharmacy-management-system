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

  @Column({ name: 'logout_time', nullable: true })
  logoutTime: Date;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;
}
