import {AppDataSource} from '../../core/config/database';
import {Settings} from './entities/Settings';
import {AppError} from '../../core/errors/AppError';

export class SettingsService {
    private repo = AppDataSource.getRepository(Settings);

    async getFranchiseAmount(): Promise<number> {
        const setting = await this.repo.findOneBy({key: 'franchise_amount'});
        return setting ? Number(setting.value) : 0;
    }

    async setFranchiseAmount(amount: number) {
        let setting = await this.repo.findOneBy({key: 'franchise_amount'});
        if (!setting) {
            setting = this.repo.create({key: 'franchise_amount', value: amount});
        } else {
            setting.value = amount;
        }
        return this.repo.save(setting);
    }
}
