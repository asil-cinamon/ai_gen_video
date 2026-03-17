import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'video_job' })
export class VideoJobEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text', default: 'PENDING' })
  status!: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

  @Column({ type: 'simple-json', nullable: true })
  input!: any;

  @Column({ type: 'text', nullable: true })
  resultUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  startedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  finishedAt?: Date;
}
