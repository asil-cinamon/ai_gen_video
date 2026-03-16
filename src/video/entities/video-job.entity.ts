export class VideoJobEntity {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  input: any;
  resultUrl?: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
}
