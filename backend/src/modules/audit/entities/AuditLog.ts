import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({name: 'actor_id', type: 'uuid', nullable: true})
    actorId: string | null;

    @Column({name: 'actor_email', type: 'varchar', nullable: true})
    actorEmail: string | null;

    @Index()
    @Column({type: 'varchar'})
    action: string;

    @Column({name: 'entity_type', type: 'varchar', nullable: true})
    entityType: string | null;

    @Column({name: 'entity_id', type: 'varchar', nullable: true})
    entityId: string | null;

    @Column({type: 'jsonb', nullable: true})
    metadata: Record<string, unknown> | null;

    @Column({name: 'ip_address', type: 'varchar', nullable: true})
    ipAddress: string | null;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;
}
