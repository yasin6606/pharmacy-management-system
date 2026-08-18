import {SettingsService} from '../src/modules/settings/settings.service';
import {AppDataSource} from '../src/core/config/database';

jest.mock('../src/core/config/database', () => ({
    AppDataSource: {getRepository: jest.fn()},
}));

describe('SettingsService', () => {
    let service: SettingsService;
    let repo: any;

    beforeEach(() => {
        repo = {
            findOneBy: jest.fn(),
            create: jest.fn((d) => d),
            save: jest.fn(async (d) => d),
        };
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(repo);
        service = new SettingsService();
    });

    it('getFranchiseAmount returns 0 when unset', async () => {
        repo.findOneBy.mockResolvedValue(null);
        expect(await service.getFranchiseAmount()).toBe(0);
    });

    it('getFranchiseAmount parses stored value', async () => {
        repo.findOneBy.mockResolvedValue({key: 'franchise_amount', value: '1500'});
        expect(await service.getFranchiseAmount()).toBe(1500);
    });

    it('setFranchiseAmount creates when missing', async () => {
        repo.findOneBy.mockResolvedValue(null);
        await service.setFranchiseAmount(2000);
        expect(repo.create).toHaveBeenCalledWith({key: 'franchise_amount', value: 2000});
        expect(repo.save).toHaveBeenCalled();
    });

    it('setFranchiseAmount updates existing', async () => {
        const existing = {key: 'franchise_amount', value: 100};
        repo.findOneBy.mockResolvedValue(existing);
        await service.setFranchiseAmount(300);
        expect(existing.value).toBe(300);
        expect(repo.save).toHaveBeenCalledWith(existing);
    });
});
