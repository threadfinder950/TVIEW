import mongoose from 'mongoose';

export type EventType = 'Work' | 'Education' | 'Residence' | 'Military' | 'Medical' | 'Travel' | 'Achievement' | 'Custom';

export interface IEventDate {
  start?: Date;
  end?: Date;
  isRange: boolean;
}

export interface IEventLocation {
  place?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface IEvent extends mongoose.Document {
  person: mongoose.Types.ObjectId;
  type: EventType;
  title: string;
  description?: string;
  date: IEventDate;
  location?: IEventLocation;
  media: mongoose.Types.ObjectId[];
  notes?: string;
  sources?: string[];
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new mongoose.Schema<IEvent>({
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  type: {
    type: String,
    enum: ['Work', 'Education', 'Residence', 'Military', 'Medical', 'Travel', 'Achievement', 'Custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  date: {
    start: Date,
    end: Date,
    isRange: {
      type: Boolean,
      default: false
    }
  },
  location: {
    place: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  media: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  }],
  notes: String,
  sources: [String],
  customFields: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

export default mongoose.model<IEvent>('Event', eventSchema);
