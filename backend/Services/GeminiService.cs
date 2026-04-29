using System.Text;
using System.Text.Json;

namespace backend.Services;

public class GeminiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GeminiService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> GenerateFarewellTextAsync(string userBurden)
    {
        var apiKey = _configuration["AI_APIs:Gemini:ApiKey"];
        var modelId = _configuration["AI_APIs:Gemini:ModelId"];
        
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent?key={apiKey}";

        var prompt = $"User’s burden: '{userBurden}'. Write a short (max 2–3 sentences), poetic letter/response that helps them let go of this burden, in the peaceful, countercultural spirit of Bob Dylan’s 1973-era 'Knockin’ on Heaven’s Door'. Let the tone feel like a laid-back, hopeful 70s FM radio host.";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            
            var generatedText = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return generatedText ?? "The radio signal weakened, amigo... Try tuning in again.";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Gemini API Error: {ex.Message}");
            throw new Exception("There was an error generating the text.", ex);
        }
    }
}
