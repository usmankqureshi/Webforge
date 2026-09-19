using Microsoft.EntityFrameworkCore;
using Webforge.Domain.Posts;
using Webforge.Infrastructure.Persistence;

namespace Webforge.Api.Posts;

public static class PostEndpoints
{
    public static void MapPostEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var posts = endpoints.MapGroup("/api/posts").WithTags("Posts");
        posts.MapGet("/", async (WebforgeDbContext db, CancellationToken ct) =>
            Results.Ok((await db.Posts.AsNoTracking().OrderByDescending(p => p.CreatedAt)
                .ThenBy(p => p.Id).ToListAsync(ct)).Select(PostResponse.From)));

        posts.MapGet("/{id:guid}", async (Guid id, WebforgeDbContext db, CancellationToken ct) =>
            await db.Posts.AsNoTracking().SingleOrDefaultAsync(p => p.Id == id, ct) is { } post
                ? Results.Ok(PostResponse.From(post)) : Results.NotFound());

        posts.MapPost("/", async (SavePostRequest request, WebforgeDbContext db, CancellationToken ct) =>
        {
            var errors = Validate(request);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            var post = Post.CreateDraft(request.Title!, request.Body!, request.Thumbnail);
            db.Posts.Add(post);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/posts/{post.Id}", PostResponse.From(post));
        });

        posts.MapPut("/{id:guid}", async (Guid id, SavePostRequest request, WebforgeDbContext db, CancellationToken ct) =>
        {
            var errors = Validate(request);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            var post = await db.Posts.SingleOrDefaultAsync(p => p.Id == id, ct);
            if (post is null) return Results.NotFound();
            post.Update(request.Title!, request.Body!, request.Thumbnail);
            await db.SaveChangesAsync(ct);
            return Results.Ok(PostResponse.From(post));
        });

        posts.MapDelete("/{id:guid}", async (Guid id, WebforgeDbContext db, CancellationToken ct) =>
        {
            var post = await db.Posts.SingleOrDefaultAsync(p => p.Id == id, ct);
            if (post is null) return Results.NotFound();
            db.Posts.Remove(post);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });
    }

    private static Dictionary<string, string[]> Validate(SavePostRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors["title"] = ["Title is required."];
        else if (request.Title.Trim().Length > 200) errors["title"] = ["Title cannot exceed 200 characters."];
        if (request.Body is null) errors["body"] = ["Body must not be null. An empty body is allowed."];
        if (!PostThumbnail.IsValid(request.Thumbnail)) errors["thumbnail"] = [PostThumbnail.ValidationMessage];
        return errors;
    }
}

public sealed record SavePostRequest(string? Title, string? Body, string? Thumbnail = null);
public sealed record PostResponse(Guid Id, string Title, string Body, string Status, DateTimeOffset CreatedAt, string? Thumbnail = null)
{
    public static PostResponse From(Post post) => new(post.Id, post.Title, post.Body, post.Status.ToString(), post.CreatedAt, post.Thumbnail);
}
