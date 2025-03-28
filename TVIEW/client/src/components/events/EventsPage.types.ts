export type EventType =
  | 'Work'
  | 'Education'
  | 'Residence'
  | 'Military'
  | 'Medical'
  | 'Travel'
  | 'Achievement'
  | 'Custom'
  | 'Marriage'
  | 'Divorce'
  | 'Engagement'
  | 'Separation'
  | 'Annulment'
  | 'Adoption'
  | 'Baptism'
  | 'Burial'
  | 'Birth'
  | 'Death'
  | 'Retirement'
  | 'Graduation'
  | 'Census'
  | 'Contact'
  | 'ResearchNote';

export interface IEventDate {
  start?: string;
  end?: string;
  isRange: boolean;
}

export interface IEventLocation {
  place?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface PersonName {
  given: string;
  surname: string;
}

export interface Person {
  _id: string;
  names: PersonName[];
}

export interface IEvent {
  _id: string;
  person?: string;
  persons: Person[];
  type: EventType;
  title: string;``
  description?: string;
  date: IEventDate;
  location?: IEventLocation;
  media: string[];
  notes?: string;
  sources?: string[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
