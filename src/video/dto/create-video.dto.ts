export class CreateVideoDto {
  title?: string;
  templateId?: string;
  assets: Array<{ type: 'image' | 'audio' | 'text'; uri?: string; data?: string }>;
  params?: { resolution?: string; fps?: number; duration?: number };
}
