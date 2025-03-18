import mongoose from 'mongoose';

export type RelationshipType = 'Parent-Child' | 'Spouse' | 'Sibling' | 'Other';

export interface IRelationshipDate {
  start?: Date;
  end?: Date;
}

export interface IRelationship extends mongoose.Document {
  type: RelationshipType;
  persons: mongoose.Types.ObjectId[];
  date?: IRelationshipDate;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const relationshipSchema = new mongoose.Schema<IRelationship>({
  type: {
    type: String,
    enum: ['Parent-Child', 'Spouse', 'Sibling', 'Other'],
    required: true
  },
  persons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  }],
  date: {
    start: Date,
    end: Date
  },
  notes: String
}, {
  timestamps: true
});

// Ensure at least 2 persons are included in a relationship
relationshipSchema.pre('save', function(next) {
  if (this.persons.length < 2) {
    const error = new Error('Relationship must include at least 2 persons');
    return next(error);
  }
  next();
});

export default mongoose.model<IRelationship>('Relationship', relationshipSchema);
