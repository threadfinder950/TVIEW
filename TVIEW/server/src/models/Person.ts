import mongoose from 'mongoose';

export interface IName {
  given: string;
  surname: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface IVitalEvent {
  date?: Date;
  place?: string;
  notes?: string;
}

export interface IPerson extends mongoose.Document {
  names: IName[];
  birth?: IVitalEvent;
  death?: IVitalEvent;
  gender: 'M' | 'F' | 'O' | 'U'; // Male, Female, Other, Unknown
  media: mongoose.Types.ObjectId[];
  notes?: string;
  sourceId?: string; // Original ID from GEDCOM
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const nameSchema = new mongoose.Schema<IName>({
  given: String,
  surname: String,
  fromDate: Date,
  toDate: Date
});


const vitalEventSchema = new mongoose.Schema<IVitalEvent>({
  date: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return value === null || !isNaN(value.getTime());
      },
      message: props => `${props.value} is not a valid date!`
    }
  },
  place: String,
  notes: String
});

const personSchema = new mongoose.Schema<IPerson>({
  names: [nameSchema],
  birth: vitalEventSchema,
  death: vitalEventSchema,
  gender: {
    type: String,
    enum: ['M', 'F', 'O', 'U'], // Male, Female, Other, Unknown
    default: 'U'
  },
  media: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  }],
  notes: String,
  sourceId: String, // Original ID from GEDCOM
  customFields: mongoose.Schema.Types.Mixed, // For additional information
}, {
  timestamps: true
});

export default mongoose.model<IPerson>('Person', personSchema);
