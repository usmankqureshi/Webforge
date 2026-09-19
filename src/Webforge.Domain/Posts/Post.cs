namespace Webforge.Domain.Posts;

public enum PostStatus { Draft, InReview, Scheduled, Published, Archived }

public sealed class Post
{
    private Post() { }

    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public PostStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public void Update(string title, string body)
    {
        Validate(title, body);
        Title = title.Trim();
        Body = body;
    }

    private static void Validate(string title, string body)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentNullException.ThrowIfNull(body);
        if (title.Trim().Length > 200)
            throw new ArgumentException("Title cannot exceed 200 characters.", nameof(title));

    }

    public static Post CreateDraft(string title, string body)
    {
        Validate(title, body);
        return new Post
        {
            Id = Guid.NewGuid(), Title = title.Trim(), Body = body,
            Status = PostStatus.Draft, CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
