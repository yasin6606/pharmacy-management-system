import { Repository } from 'typeorm';
import { AppDataSource } from '../../../core/config/database';
import { Employee } from '../entities/Employee';

export class EmployeeRepository extends Repository<Employee> {
  constructor() {
    super(Employee, AppDataSource.manager);
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.findOne({ where: { email } });
  }

  async findWithBranch(id: string): Promise<Employee | null> {
    return this.findOne({ where: { id }, relations: ['currentBranch'] });
  }

  async findAllWithBranches(): Promise<Employee[]> {
    return this.find({ relations: ['currentBranch'] });
  }
}
