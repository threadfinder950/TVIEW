# Time Tunnel Server - Backend API

A modern TypeScript-based REST API for the Time Tunnel GEDCOM Manager application.

## Features

- Import GEDCOM genealogical data
- Manage people, events, relationships, and media
- Timeline generation for individual people
- Export data for Time Tunnel VR experience

## Tech Stack

- Node.js & Express
- TypeScript
- MongoDB with Mongoose
- Multer for file uploads
- Archiver for file compression
- Winston for logging

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/time-tunnel-server.git
cd time-tunnel-server
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory with your environment variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timetunnel
NODE_ENV=development
LOG_LEVEL=info
UPLOAD_PATH=./uploads
EXPORT_PATH=./exports
```

4. Start the development server

```bash
npm run dev
```

## API Endpoints

### Person API

- `GET /api/persons` - Get all persons
- `GET /api/persons/:id` - Get a specific person
- `POST /api/persons` - Create a new person
- `PATCH /api/persons/:id` - Update a person
- `DELETE /api/persons/:id` - Delete a person
- `GET /api/persons/:id/events` - Get events for a person
- `GET /api/persons/:id/relationships` - Get relationships for a person
- `GET /api/persons/:id/family` - Get family members of a person

### Event API

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get a specific event
- `POST /api/events` - Create a new event
- `PATCH /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### GEDCOM Import API

- `POST /api/gedcom/upload` - Upload and import a GEDCOM file

### Export API

- `GET /api/export/all` - Export all data for Time Tunnel VR
- `GET /api/export/person/:id` - Export data for a specific person

## Data Models

### Person

Represents an individual with:
- Names (can have multiple over time)
- Birth and death information
- Gender
- Media attachments
- Notes and additional fields

### Event

Represents life events with:
- Type (Work, Education, Residence, etc.)
- Date (single date or date range)
- Location (including coordinates)
- Description and notes

### Relationship

Represents connections between people:
- Type (Parent-Child, Spouse, Sibling, Other)
- Persons involved
- Date range
- Notes

### Media

Represents media files associated with people or events:
- Type (Photo, Document, Audio, Video)
- File information
- Date
- Tags
- Associated persons and events

## Development

### Building for production

```bash
npm run build
```

### Starting production server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Folder Structure

```
src/                           # Source directory
├── config/                    # Configuration files
├── controllers/               # Request handlers 
├── models/                    # Mongoose models
├── routes/                    # API routes
├── services/                  # Business logic
├── types/                     # Type definitions
├── utils/                     # Utility functions
├── middleware/                # Express middleware
└── app.ts                     # Express app setup
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request
