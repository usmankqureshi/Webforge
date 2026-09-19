using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Webforge.Api.Posts;
using Webforge.Infrastructure.Persistence;

namespace Webforge.IntegrationTests;

public class PostApiTests
{
    private static WebApplicationFactory<Program> CreateFactory()
    {
        var database = Guid.NewGuid().ToString();
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<WebforgeDbContext>();
                services.RemoveAll<DbContextOptions<WebforgeDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<WebforgeDbContext>>();
                services.AddDbContext<WebforgeDbContext>(options => options.UseInMemoryDatabase(database));
            }));
    }

    [Fact]
    public async Task PostsCanBeCreatedListedUpdatedAndDeleted()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        Assert.Empty((await client.GetFromJsonAsync<PostResponse[]>("/api/posts"))!);
        var created = await client.PostAsJsonAsync("/api/posts", new { title = "  My story  ", body = "First body" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var post = (await created.Content.ReadFromJsonAsync<PostResponse>())!;
        Assert.Equal("My story", post.Title);
        Assert.Equal("Draft", post.Status);
        Assert.Equal($"/api/posts/{post.Id}", created.Headers.Location?.ToString());
        Assert.Equal(post, await client.GetFromJsonAsync<PostResponse>(created.Headers.Location));
        Assert.Single((await client.GetFromJsonAsync<PostResponse[]>("/api/posts"))!);

        var updated = await client.PutAsJsonAsync(created.Headers.Location, new { title = "Revised", body = "" });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var revised = (await updated.Content.ReadFromJsonAsync<PostResponse>())!;
        Assert.Equal("Revised", revised.Title);
        Assert.Equal("", revised.Body);
        Assert.Equal(post.CreatedAt, revised.CreatedAt);
        Assert.Equal(revised, await client.GetFromJsonAsync<PostResponse>(created.Headers.Location));

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync(created.Headers.Location)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(created.Headers.Location)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync(created.Headers.Location)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await client.PutAsJsonAsync(created.Headers.Location, new { title = "Missing", body = "" })).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<PostResponse[]>("/api/posts"))!);
    }

    [Fact]
    public async Task InvalidRequestsAreRejectedWithoutChangingStoredContent()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var created = await client.PostAsJsonAsync("/api/posts", new { title = "Original", body = "Body" });
        foreach (var request in new[]
        {
            new SavePostRequest(null, "Body"), new SavePostRequest("   ", "Body"),
            new SavePostRequest(new string('a', 201), "Body"), new SavePostRequest("Valid", null)
        })
        {
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/posts", request)).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync(created.Headers.Location, request)).StatusCode);
        }
        var posts = (await client.GetFromJsonAsync<PostResponse[]>("/api/posts"))!;
        Assert.Single(posts);
        Assert.Equal("Original", posts[0].Title);
        Assert.Equal("Body", posts[0].Body);
    }
    [Fact]
    public async Task ThumbnailCanBeSavedReplacedAndRemoved()
    {
        const string image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var created = await client.PostAsJsonAsync("/api/posts", new SavePostRequest("Image", "", image));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal(image, (await client.GetFromJsonAsync<PostResponse>(created.Headers.Location))!.Thumbnail);
        Assert.Equal(image, (await client.GetFromJsonAsync<PostResponse[]>("/api/posts"))![0].Thumbnail);
        var replacement = image + "\n";
        var updated = await client.PutAsJsonAsync(created.Headers.Location, new SavePostRequest("Image", "", replacement));
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal(replacement, (await client.GetFromJsonAsync<PostResponse>(created.Headers.Location))!.Thumbnail);
        var removed = await client.PutAsJsonAsync(created.Headers.Location, new SavePostRequest("Image", "", null));
        Assert.Equal(HttpStatusCode.OK, removed.StatusCode);
        Assert.Null((await client.GetFromJsonAsync<PostResponse>(created.Headers.Location))!.Thumbnail);
    }

    [Theory]
    [InlineData("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")]
    [InlineData("data:image/png;base64,not-base64")]
    [InlineData("data:image/png;base64,SGVsbG8gdGhpcyBpcyBub3QgYW4gaW1hZ2U=")]
    public async Task InvalidThumbnailsReturnValidationErrors(string thumbnail)
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/posts", new SavePostRequest("Image", "", thumbnail));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("thumbnail", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public void OversizedThumbnailIsRejected()
    {
        var thumbnail = "data:image/png;base64," + Convert.ToBase64String(new byte[Webforge.Domain.Posts.PostThumbnail.MaxBytes + 1]);
        Assert.False(Webforge.Domain.Posts.PostThumbnail.IsValid(thumbnail));
    }
}
