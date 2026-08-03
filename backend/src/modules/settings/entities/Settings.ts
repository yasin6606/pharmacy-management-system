import {Entity, PrimaryColumn, Column} from 'typeorm';

@Entity('settings')
export class Settings {
    @PrimaryColumn()
    key: string;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        transformer: {from: (v: string) => parseFloat(v), to: (v: number) => v}
    })
    value: number;
}
