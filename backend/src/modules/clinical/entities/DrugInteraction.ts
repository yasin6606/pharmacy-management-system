import {Entity, PrimaryGeneratedColumn, Column, Index} from 'typeorm';

@Entity('drug_interactions')
@Index(['drugAId', 'drugBId'], {unique: true})
export class DrugInteraction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({name: 'drug_a_id', type: 'uuid'})
    drugAId: string;

    @Column({name: 'drug_b_id', type: 'uuid'})
    drugBId: string;

    /** mild | moderate | severe */
    @Column({type: 'varchar', default: 'moderate'})
    severity: 'mild' | 'moderate' | 'severe';

    @Column({type: 'text'})
    description: string;
}
