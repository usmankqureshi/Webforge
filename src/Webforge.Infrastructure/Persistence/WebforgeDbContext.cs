using Microsoft.EntityFrameworkCore;
using Webforge.Domain.Posts;

namespace Webforge.Infrastructure.Persistence;

public sealed class WebforgeDbContext(DbContextOptions<WebforgeDbContext> options) : DbContext(options)
{
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var post = modelBuilder.Entity<Post>();
        post.HasKey(p => p.Id);
        post.Property(p => p.Title).HasMaxLength(200).IsRequired();
        post.Property(p => p.Body).IsRequired();
        post.Property(p => p.Status).HasConversion<string>().HasMaxLength(32);
        post.HasIndex(p => p.Status);
    }
}
