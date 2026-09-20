namespace Webforge.Application;

public sealed record ApplicationInfo(string Name, string Status)
{
    public static ApplicationInfo Current => new("Webforge", "Foundation ready");
}
