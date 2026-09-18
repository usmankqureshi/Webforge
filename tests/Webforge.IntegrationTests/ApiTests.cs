using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Mvc.Testing;
using Webforge.Application;

namespace Webforge.IntegrationTests;

public class ApiTests
{
    [Fact]
    public async Task InfoAndLivenessWorkWithoutDatabase()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        var info = await client.GetFromJsonAsync<ApplicationInfo>("/api/info");
        Assert.Equal("Webforge", info?.Name);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
    }

    [Fact]
    public async Task ReadinessReportsUnavailableWhenDatabaseIsNotConfigured()
    {
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Webforge"] = null
                })));
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/ready")).StatusCode);
    }

    [Theory]
    [InlineData("Development", HttpStatusCode.OK)]
    [InlineData("Production", HttpStatusCode.NotFound)]
    public async Task OpenApiIsOnlyAvailableInDevelopment(string environment, HttpStatusCode expected)
    {
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseEnvironment(environment));
        using var client = factory.CreateClient();
        Assert.Equal(expected, (await client.GetAsync("/openapi/v1.json")).StatusCode);
    }
}
