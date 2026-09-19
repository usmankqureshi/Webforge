namespace Webforge.Domain.Posts;

public static class PostThumbnail
{
    public const int MaxBytes = 1024 * 1024;
    public const string ValidationMessage = "Thumbnail must be a base64 PNG, JPEG, or WebP image up to 1 MB.";

    public static bool IsValid(string? value)
    {
        if (value is null) return true;
        if (value.Length > 4 * ((MaxBytes + 2) / 3) + 32) return false;
        var comma = value.IndexOf(',');
        if (comma < 0) return false;
        var header = value[..comma];
        if (header is not ("data:image/png;base64" or "data:image/jpeg;base64" or "data:image/webp;base64"))
            return false;
        byte[] bytes;
        try { bytes = Convert.FromBase64String(value[(comma + 1)..]); }
        catch (FormatException) { return false; }
        if (bytes.Length is < 12 or > MaxBytes) return false;
        return header switch
        {
            "data:image/png;base64" => bytes.AsSpan().StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            "data:image/jpeg;base64" => bytes[0] == 255 && bytes[1] == 216 && bytes[2] == 255,
            "data:image/webp;base64" => bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };
    }
}
