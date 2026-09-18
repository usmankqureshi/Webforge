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
}
