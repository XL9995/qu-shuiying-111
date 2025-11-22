export enum AppMode {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO'
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type VideoResolution = '720p' | '1080p';
export type VideoAspectRatio = '16:9' | '9:16';

export interface BatchItem {
  id: string;
  file: File;
  status: ProcessingStatus;
  originalUrl: string;
  resultUrl?: string;
  error?: string;
  timestamp: number;
  videoConfig?: {
    resolution: VideoResolution;
    aspectRatio: VideoAspectRatio;
  };
}

export interface ProcessedImage {
  original: string;
  processed: string;
}

export interface ProcessedVideo {
  previewUrl: string; // The generated MP4 URL
  originalThumb?: string;
}