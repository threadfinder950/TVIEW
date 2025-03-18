# Time Tunnel Server - Project Structure

```
time-tunnel-server/
├── src/                           # Source directory
│   ├── config/                    # Configuration files
│   │   ├── db.ts                  # Database connection
│   │   └── config.ts              # App configuration variables
│   ├── controllers/               # Request handlers
│   │   ├── gedcomController.ts    # GEDCOM import controller
│   │   ├── personController.ts    # Person data controller
│   │   ├── eventController.ts     # Event data controller
│   │   └── exportController.ts    # Data export controller
│   ├── models/                    # Mongoose models
│   │   ├── Person.ts              # Person model
│   │   ├── Event.ts               # Event model
│   │   ├── Relationship.ts        # Relationship model
│   │   └── Media.ts               # Media model
│   ├── routes/                    # API routes
│   │   ├── gedcomRoutes.ts        # GEDCOM import routes
│   │   ├── personRoutes.ts        # Person data routes
│   │   ├── eventRoutes.ts         # Event data routes
│   │   └── exportRoutes.ts        # Data export routes
│   ├── services/                  # Business logic
│   │   ├── gedcomService.ts       # GEDCOM parsing service
│   │   └── exportService.ts       # Export generation service
│   ├── types/                     # Type definitions
│   │   └── index.ts               # Type definitions for the app
│   ├── utils/                     # Utility functions
│   │   ├── asyncHandler.ts        # Async error handler
│   │   ├── errorResponse.ts       # Error response utility
│   │   └── logger.ts              # Logging utility
│   ├── middleware/                # Express middleware
│   │   ├── errorMiddleware.ts     # Error handling middleware
│   │   └── validateRequest.ts     # Request validation middleware
│   └── app.ts                     # Express app setup
├── uploads/                       # Upload directory for files
├── exports/                       # Directory for export files
├── .env                           # Environment variables
├── .gitignore                     # Git ignore file
├── package.json                   # Project dependencies
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project documentation
```

This structure organizes the backend code in a modular, maintainable way with clear separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Models**: Define database schemas and model methods
- **Routes**: Define API endpoints and connect them to controllers
- **Services**: Contain complex business logic
- **Utils**: Reusable utility functions
- **Middleware**: Express middleware for request processing
- **Config**: Application configuration

All code is in TypeScript for better type safety and consistency with the frontend.
