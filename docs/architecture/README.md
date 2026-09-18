# Initial architecture

Dependencies point inward: Domain has no project dependencies; Application references
Domain; Infrastructure references Application; API references Application and Infrastructure.
Worker references Infrastructure and currently has no background jobs.

The initial Post model supports draft creation only. Authentication, authorization,
content APIs, publishing, Redis and RabbitMQ are not implemented yet. Do not expose
this development scaffold as a production CMS.

SQL Server migrations are applied explicitly, not on API startup. `/health` checks
process liveness; `/health/ready` checks database access and the Posts table.
API smoke tests use an in-process server and do not require SQL Server.
