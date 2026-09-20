using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Webforge.Infrastructure.Persistence;

namespace Webforge.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<WebforgeDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Webforge")
                ?? throw new InvalidOperationException("Configure ConnectionStrings:Webforge before accessing the database.")));
        return services;
    }
}
