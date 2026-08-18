import {Entity, PrimaryColumn, Column, UpdateDateColumn} from 'typeorm';

/**
 * String key/value store for integration secrets and config
 * (API keys, base URLs, coverage defaults). Never expose raw secrets
 * in list responses without masking.
 */
@Entity('integration_settings')
export class IntegrationSetting {
    @PrimaryColumn({type: 'varchar', length: 128})
    key: string;

    @Column({type: 'text', default: ''})
    value: string;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;
}
