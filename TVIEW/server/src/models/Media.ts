import mongoose from 'mongoose';

export type MediaType = 'Photo' | 'Document' | 'Audio' | 'Video';

export interface IMediaFile {
  path: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface IMedia extends mongoose.Document {
  type: MediaType;
  title?: string;
  description?: string;
  file: IMediaFile;
  date?: Date;
  tags?: string[];
  persons: mongoose.Types.ObjectId[];
  events: mongoose.Types.ObjectId[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new mongoose.Schema<IMedia>({
  type: {
    type: String,
    enum: ['Photo', 'Document', 'Audio', 'Video'],
    required: true
  },
  title: String,
  description: String,
  file: {
    path: {
      type: String,
      required: true
    },
    originalName: String,
    mimeType: String,
    size: Number
  },
  date: Date,
  tags: [String],
  persons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  }],
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  notes: String
}, {
  timestamps: true
});

export default mongoose.model<IMedia>('Media', mediaSchema);
