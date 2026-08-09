# Project Rules

This file defines the project-specific rules and guidelines for AI agents working in this workspace.

## Technology Stack

### Frontend (`/frontend`)
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Module System**: ES Modules
- **Development Server**: Run `npm run dev` in the `frontend` directory (configured to run on port 3000).

### Backend (`/backend`)
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MySQL (using `mysql2` package)
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Module System**: ES Modules (`"type": "module"`)
- **Development Server**: Run `npm run dev` in the `backend` directory (uses Node's native `--watch` mode).
- **Scripts**: Contains various database scripts (`seed`, `seed:users`, `seed:large`, `truncate`, `db:init`).

## Architectural Guidelines
1. **Separation of Concerns**: Keep frontend UI logic in `/frontend` and backend API logic in `/backend`. Ensure API calls from the frontend correctly route to the backend server.
2. **Database Queries**: Since this project uses `mysql2`, write raw SQL queries or use the project's existing database interaction patterns. Avoid suggesting ORMs unless one is already introduced.
3. **Module Format**: Both frontend and backend use ES Modules. Always use `import`/`export` syntax, not `require()`.

## Development Best Practices
- When installing dependencies, ensure you are in the correct directory (`frontend` or `backend`).
- Follow consistent error handling in the backend routes and controllers.
- Provide descriptive messages when working on UI and focus on matching existing patterns.
- **Consistency**: Maintain consistency across the project by using the same type of modules, functional patterns, and color schemes as the existing codebase.
- **New Feature Generation**: If requested to create a file or feature that does not currently exist in the codebase, generate it from scratch while strictly adhering to the project's existing functionality, style, and architectural patterns.
