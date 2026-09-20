namespace Webforge.Domain.Posts;

public enum PostStatus { Draft, InReview, Scheduled, Published, Archived }

public sealed class Post
{
    private Post() { }

    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public string? Thumbnail { get; private set; }
    public PostStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public void Update(string title, string body, string? thumbnail = null)
    {
        Validate(title, body, thumbnail);
        Title = title.Trim();
        Body = body;
        Thumbnail = thumbnail;
    }

    private static void Validate(string title, string body, string? thumbnail = null)
    {
        if (!PostThumbnail.IsValid(thumbnail))
            throw new ArgumentException(PostThumbnail.ValidationMessage, nameof(thumbnail));
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentNullException.ThrowIfNull(body);
        if (title.Trim().Length > 200)
            throw new ArgumentException("Title cannot exceed 200 characters.", nameof(title));

    }

    public static Post CreateDraft(string title, string body, string? thumbnail = null)
    {
        Validate(title, body, thumbnail);
        return new Post
        {
            Id = Guid.NewGuid(), Title = title.Trim(), Body = body, Thumbnail = thumbnail,
            Status = PostStatus.Draft, CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
