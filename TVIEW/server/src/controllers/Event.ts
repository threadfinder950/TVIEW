// src/models/Event.ts - Modified to properly handle the persons array
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
  // Keep both fields for compatibility
  person?: mongoose.Types.ObjectId;
  persons: mongoose.Types.ObjectId[];
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
  // Keep the original person field for compatibility
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: false // Make it optional since we're transitioning
  },
  // Add the new persons array
  persons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  }],
  type: {
    type: String,
    enum: ['Work', 'Education', 'Residence', 'Military', 'Medical', 'Travel', 'Achievement', 'Custom'],
    required: true
  },
  // Other fields remain the same
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

// Add a pre-save hook to ensure consistency between person and persons
eventSchema.pre('save', function(next) {
  // If persons array has items but person is not set, use the first person
  if (this.persons && this.persons.length > 0 && !this.person) {
    this.person = this.persons[0];
  }
  
  // If person is set but persons array is empty, add person to persons
  if (this.person && (!this.persons || this.persons.length === 0)) {
    this.persons = [this.person];
  }
  
  next();
});

export default mongoose.model<IEvent>('Event', eventSchema);