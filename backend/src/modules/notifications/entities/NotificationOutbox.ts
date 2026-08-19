import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index} from 'typeorm';

@Entity('notification_outbox')
export class NotificationOutbox {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** sms | email | push */
    @Column({type: 'varchar', default: 'sms'})
    channel: 'sms' | 'email' | 'push';

    @Index()
    @Column({type: 'varchar'})
    recipient: string;

    @Column({type: 'text'})
    body: string;

    @Column({type: 'varchar', default: 'pending'})
    status: 'pending' | 'sent' | 'failed' | 'skipped';

    @Column({type: 'varchar', nullable: true})
    purpose: string | null;

    @Column({type: 'jsonb', nullable: true})
    metadata: Record<string, unknown> | null;

    @Column({name: 'error_message', type: 'text', nullable: true})
    errorMessage: string | null;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @Column({name: 'sent_at', type: 'timestamp', nullable: true})
    sentAt: Date | null;
}
