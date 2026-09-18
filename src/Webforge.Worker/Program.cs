using Webforge.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddInfrastructure(builder.Configuration);
// Register background services here when messaging is implemented.
await builder.Build().RunAsync();
