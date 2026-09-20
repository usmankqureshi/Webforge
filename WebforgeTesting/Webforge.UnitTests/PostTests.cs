using Webforge.Domain.Posts;

namespace Webforge.UnitTests;

public class PostTests
{
    [Fact]
    public void NewPostIsAnUnpublishedDraft()
    {
        var post = Post.CreateDraft("  First post  ", "");
        Assert.Equal(PostStatus.Draft, post.Status);
        Assert.Equal("First post", post.Title);
        Assert.NotEqual(Guid.Empty, post.Id);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void EmptyTitleIsRejected(string title) =>
        Assert.Throws<ArgumentException>(() => Post.CreateDraft(title, "Body"));

    [Fact]
    public void TitleCannotExceedDatabaseLimit() =>
        Assert.Throws<ArgumentException>(() => Post.CreateDraft(new string('a', 201), "Body"));
    [Fact]
    public void UpdateChangesContentAndPreservesIdentityAndCreationTime()
    {
        var post = Post.CreateDraft("Original", "Body");
        var id = post.Id;
        var createdAt = post.CreatedAt;
        post.Update("  Revised  ", "New body");
        Assert.Equal("Revised", post.Title);
        Assert.Equal("New body", post.Body);
        Assert.Equal(id, post.Id);
        Assert.Equal(createdAt, post.CreatedAt);
        Assert.Equal(PostStatus.Draft, post.Status);
    }

    [Fact]
    public void InvalidUpdateDoesNotPartiallyChangePost()
    {
        var post = Post.CreateDraft("Original", "Body");
        Assert.Throws<ArgumentException>(() => post.Update(" ", "Changed"));
        Assert.Throws<ArgumentException>(() => post.Update(new string('a', 201), "Changed"));
        Assert.Throws<ArgumentNullException>(() => post.Update("Changed", null!));
        Assert.Equal("Original", post.Title);
        Assert.Equal("Body", post.Body);
    }
}
