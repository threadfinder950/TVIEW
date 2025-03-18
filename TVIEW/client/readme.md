# Time Tunnel GEDCOM Manager - React Frontend

This project is a modern React application built with Vite and TypeScript for managing GEDCOM genealogical data for the Time Tunnel VR experience.

## Key Features

- Import GEDCOM files for genealogical data
- View and manage people records
- Create and edit life events with timelines
- Export data for use in VR experiences
- Modern UI with Material UI components

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tooling
- **Material UI 5** - Component library
- **React Router 6** - Navigation
- **Axios** - API client
- **date-fns** - Date manipulation
- **MUI X Date Pickers** - Date input components

## Project Setup

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Project Structure

```
src/
├── components/
│   ├── export/
│   │   └── ExportData.tsx
│   ├── forms/
│   │   └── EventEditor.tsx
│   ├── gedcom/
│   │   └── GedcomImport.tsx
│   └── timeline/
│       └── PersonTimeline.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## API Integration

The frontend connects to a backend API running on http://localhost:5000 with the following endpoints:

- `/api/persons` - Get all people
- `/api/persons/:id` - Get person details
- `/api/persons/:id/events` - Get events for a person
- `/api/events` - Create events
- `/api/events/:id` - Update/delete events
- `/api/gedcom/upload` - Import GEDCOM files
- `/api/export/all` - Export all data
- `/api/export/person/:id` - Export person data

## Building for Production

```bash
npm run build
```

The production-ready files will be available in the `dist/` directory.

## Code Consistency

This project has been refactored to use a consistent set of libraries:

- MUI v5 for all UI components
- Modern React patterns including hooks
- Standardized error handling
- Consistent styling with MUI's sx prop