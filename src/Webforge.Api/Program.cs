using Microsoft.EntityFrameworkCore;
using Webforge.Application;
using Webforge.Infrastructure;
using Webforge.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration);
var app = builder.Build();
app.UseExceptionHandler();
if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.MapGet("/api/info", () => ApplicationInfo.Current).WithName("GetApplicationInfo");
app.MapGet("/health", () => Results.Ok(new { status = "Healthy" })).ExcludeFromDescription();
app.MapGet("/health/ready", async (IServiceProvider services, CancellationToken cancellationToken) =>
{
    try
    {
        var db = services.GetRequiredService<WebforgeDbContext>();
        // Query the schema as well as the connection, so missing migrations are reported.
        await db.Posts.AnyAsync(cancellationToken);
        return Results.Ok(new { status = "Healthy" });
    }
    catch (Exception ex) when (ex is not OperationCanceledException)
    {
        return Results.Problem(statusCode: 503, title: "Database is not ready");
    }
}).ExcludeFromDescription();
app.Run();

public partial class Program { }
