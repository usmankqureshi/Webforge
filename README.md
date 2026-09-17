# Webforge

A modern, production-oriented **Content Management System (CMS)** built with **ASP.NET Core, C#, Angular, Entity Framework Core, and SQL Server**.

Webforge is an independent engineering project designed to explore and demonstrate modern .NET development practices including **Clean Architecture, RESTful API design, role-based authorization, automated testing, containerization, asynchronous messaging, caching, CI/CD, and cloud deployment**.

> **Project Status:** 🚧 Active Development

---

## Overview

Webforge provides a structured platform for creating, reviewing, publishing, and managing digital content.

Rather than functioning as a simple CRUD application, the project models a realistic content publishing workflow with different user roles, content states, revision history, media management, background processing, and event-driven functionality.

The project is being developed incrementally, starting as a modular ASP.NET Core application and introducing distributed components only where they solve a meaningful architectural problem.

---

## Technology Stack

### Backend

- C#
- .NET / ASP.NET Core
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- ASP.NET Core Identity
- xUnit

### Frontend

- Angular
- TypeScript
- HTML
- SASS/SCSS
- Bootstrap

### Architecture

- Clean Architecture
- SOLID principles
- Dependency Injection
- RESTful API design
- Modular Monolith
- Event-Driven Architecture

### Infrastructure

- Docker
- Docker Compose
- RabbitMQ
- Redis

### Cloud & DevOps

- Microsoft Azure
- Azure App Service
- Azure SQL
- Azure Service Bus
- Azure Key Vault
- Application Insights
- Azure DevOps
- CI/CD YAML Pipelines

> Some infrastructure and cloud components listed above are part of the planned development roadmap and may not yet be implemented. See the Roadmap section for current progress.

---

## Architecture

Webforge follows a Clean Architecture-inspired structure with dependencies directed toward the core business domain.

```text
                         Angular
                            |
                          HTTPS
                            |
                    ASP.NET Core API
                            |
              +-------------+-------------+
              |                           |
        Application                    Domain
        Use Cases                  Business Rules
              |
        Infrastructure
              |
      +-------+-------+---------+
      |               |         |
 SQL Server         Redis    RabbitMQ
                              |
                           Workers
```

The application is initially designed as a **modular monolith**.

Supporting processes such as notifications and asynchronous content processing can be separated into background workers where independent processing provides a genuine architectural benefit.

---

## Solution Structure

```text
Webforge/
|
+-- src/
|   +-- Webforge.Api/
|   +-- Webforge.Application/
|   +-- Webforge.Domain/
|   +-- Webforge.Infrastructure/
|   +-- Webforge.Worker/
|
+-- client/
|   +-- Webforge-angular/
|
+-- tests/
|   +-- Webforge.UnitTests/
|   +-- Webforge.IntegrationTests/
|
+-- docs/
|   +-- architecture/
|   +-- api/
|
+-- docker-compose.yml
+-- Webforge.sln
+-- README.md
+-- LICENSE
```

### Webforge.Domain

Contains the core domain model and business rules.

The Domain project has no dependency on infrastructure concerns such as databases, HTTP APIs, messaging platforms, or external services.

### Webforge.Application

Contains application use cases, contracts, validation, and orchestration of domain operations.

### Webforge.Infrastructure

Contains infrastructure implementations including:

- Entity Framework Core
- SQL Server persistence
- Identity services
- Caching
- Messaging
- External service integrations

### Webforge.Api

Provides the HTTP interface to the application through ASP.NET Core Web API.

Responsibilities include:

- API endpoints
- Authentication
- Authorization
- Request/response handling
- Middleware
- API documentation

### Webforge.Worker

Processes asynchronous background operations such as content events and notifications.

---

## Core Domain

The initial domain includes:

```text
User
 |
 +-- Roles
 +-- Audit Logs

Post
 |
 +-- Author
 +-- Category
 +-- Tags
 +-- Revisions
 +-- Media

Page
 |
 +-- Author
 +-- Revisions
 +-- Media

Category
Tag
Media
```

---

## Content Lifecycle

Content follows a defined publishing lifecycle rather than being directly created as publicly available content.

```text
Draft
  |
  v
In Review
  |
  v
Scheduled / Published
  |
  v
Archived
```

Typical post states include:

- `Draft`
- `InReview`
- `Scheduled`
- `Published`
- `Archived`

Business rules control which operations are permitted for each state.

---

## Roles & Authorization

Webforge implements role-based access control with three initial roles.

### Administrator

Administrators have full system access, including:

- User management
- Role management
- Content management
- System configuration

### Editor

Editors can:

- Review submitted content
- Edit content
- Publish content
- Archive content
- Manage categories and tags

### Author

Authors can:

- Create content
- Edit their own drafts
- Submit content for review
- Manage their own content

Authorization rules are enforced by the backend rather than relying solely on frontend restrictions.

---

## API

The REST API is organised around the primary application resources.

```text
/api/auth
/api/users
/api/posts
/api/pages
/api/categories
/api/tags
/api/media
```

Example post endpoints:

```http
GET    /api/posts
GET    /api/posts/{id}
POST   /api/posts
PUT    /api/posts/{id}
DELETE /api/posts/{id}

POST   /api/posts/{id}/submit
POST   /api/posts/{id}/publish
POST   /api/posts/{id}/archive
```

Filtering, pagination, sorting, and search are planned/supported through query parameters.

```http
GET /api/posts?page=1&pageSize=20
GET /api/posts?status=Published
GET /api/posts?category=technology
GET /api/posts?search=azure
```

API documentation is exposed through OpenAPI/Swagger during development.

---

## Database

Webforge uses **SQL Server** with **Entity Framework Core** for persistence.

Database development focuses on:

- Entity relationships
- Database migrations
- Indexing
- Transactions
- Concurrency
- Query optimization
- Async database operations
- Projection
- Pagination
- Efficient loading strategies

---

## Event-Driven Processing

Operations that do not need to complete synchronously can be processed using messaging.

For example:

```text
Editor publishes content
          |
          v
   ASP.NET Core API
          |
          +------> SQL Server
          |
          +------> ContentPublished
                       |
                       v
                    RabbitMQ
                    /      \
                   v        v
              Search     Notification
              Worker        Worker
```

Example domain/integration events include:

```text
ContentPublished
ContentUpdated
ContentDeleted
UserRegistered
MediaUploaded
```

The messaging implementation is intended to explore concepts including:

- Publishers and consumers
- Message acknowledgement
- Retry strategies
- Dead-letter queues
- Idempotent consumers
- Eventual consistency

---

## Caching

Redis is planned for caching frequently accessed public content.

The initial caching strategy follows a cache-aside approach.

```text
Request Published Content
           |
           v
        Redis
       /     \
     HIT     MISS
      |        |
   Return   SQL Server
              |
              v
            Redis
              |
              v
            Return
```

Cache invalidation occurs when relevant published content changes.

---

## Testing

Testing is treated as part of application design rather than an afterthought.

### Unit Tests

Unit tests cover domain and application business rules.

Examples include:

- An author cannot directly perform editor-only publishing operations.
- Published content must contain publication information.
- Invalid content state transitions are rejected.

### Integration Tests

Integration tests verify behaviour across application boundaries, including:

- ASP.NET Core endpoints
- Authentication and authorization
- Database persistence
- HTTP responses
- Error handling

The project uses **xUnit** for automated testing.

---

## Docker

The application is designed to support a containerized local development environment using Docker and Docker Compose.

Planned services include:

```text
Webforge-api
Webforge-client
sqlserver
rabbitmq
redis
```

The objective is to allow the development environment to be started using:

```bash
docker compose up
```

---

## CI/CD

The CI/CD pipeline is designed to automate:

```text
Push / Pull Request
        |
        v
      Restore
        |
        v
       Build
        |
        v
    Unit Tests
        |
        v
 Integration Tests
        |
        v
   Docker Build
        |
        v
      Deploy
        |
        v
      Azure
```

Azure DevOps YAML pipelines are used/planned for automated build, test, and deployment workflows.

---

## Azure Deployment

The target cloud architecture uses Microsoft Azure.

```text
Angular Frontend
       |
       v
ASP.NET Core API
       |
       +---- Azure SQL
       |
       +---- Azure Service Bus
       |
       +---- Azure Key Vault
       |
       +---- Application Insights
```

The cloud implementation is intended to demonstrate practical deployment, configuration, monitoring, secret management, and asynchronous messaging using Azure services.

---

## Getting Started

### Prerequisites

Depending on the current implementation stage, development may require:

- .NET SDK
- SQL Server
- Node.js
- Angular CLI
- Docker Desktop
- Git

Clone the repository:

```bash
git clone <repository-url>
cd Webforge
```

Restore .NET dependencies:

```bash
dotnet restore
```

Build the solution:

```bash
dotnet build
```

Run automated tests:

```bash
dotnet test
```

Run the API:

```bash
dotnet run --project src/Webforge.Api
```

Once Docker support is available, the complete local environment can be started with:

```bash
docker compose up --build
```

> Setup instructions will be updated as infrastructure components are introduced.

---

## Development Roadmap

### Phase 1 — Core CMS

- [ ] ASP.NET Core Web API
- [ ] SQL Server / EF Core
- [ ] User authentication
- [ ] Role-based authorization
- [ ] Posts
- [ ] Pages
- [ ] Categories
- [ ] Tags
- [ ] Draft/publishing workflow
- [ ] Swagger/OpenAPI

### Phase 2 — Engineering Quality

- [ ] Application/domain separation
- [ ] Validation
- [ ] Global exception handling
- [ ] Structured logging
- [ ] Unit tests
- [ ] Integration tests
- [ ] Audit logging

### Phase 3 — Containerization & Infrastructure

- [ ] Docker
- [ ] Docker Compose
- [ ] Redis
- [ ] RabbitMQ
- [ ] Background workers
- [ ] Retry handling
- [ ] Idempotent message processing

### Phase 4 — Frontend

- [ ] Angular application
- [ ] Authentication
- [ ] Admin dashboard
- [ ] Content management
- [ ] Reactive forms
- [ ] Route guards
- [ ] HTTP interceptors
- [ ] Media management

### Phase 5 — Azure & DevOps

- [ ] Azure deployment
- [ ] Azure SQL
- [ ] Azure Service Bus
- [ ] Azure Key Vault
- [ ] Application Insights
- [ ] Azure DevOps CI/CD pipeline
- [ ] Automated testing during CI

---

## Engineering Goals

Webforge is primarily an engineering-focused project.

The objective is not to reproduce every feature available in mature CMS platforms. Instead, the project focuses on applying modern software engineering practices to a realistic business domain.

Key areas of exploration include:

- Modern C# and ASP.NET Core
- RESTful API design
- Domain modelling
- Clean Architecture
- SOLID principles
- Authentication and authorization
- Relational database design
- Automated testing
- Containerization
- Asynchronous messaging
- Caching
- CI/CD
- Cloud deployment
- Observability
- Architectural trade-offs

---

## Project Background

Webforge is an independently developed portfolio and professional-development project focused on modernising and extending practical experience with the current .NET ecosystem.

The project combines established enterprise application development concepts with modern ASP.NET Core, containerization, asynchronous messaging, automated testing, CI/CD, and cloud engineering practices.

---

## License

This project is available under the terms specified in the repository's `LICENSE` file.
