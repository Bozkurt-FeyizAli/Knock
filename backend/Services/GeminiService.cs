using System.Net;
using System.Text;
using System.Text.Json;

namespace backend.Services;

public class GeminiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly List<string> _modelIds;

    public GeminiService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;

        // get model ids from configuration
        var modelSection = _configuration.GetSection("AI_APIs:Gemini:ModelIds");
        _modelIds = modelSection.Get<List<string>>() ?? new List<string>();

        // compatibility : if there is a single "ModelId" defined, add it to the list
        var singleModel = _configuration["AI_APIs:Gemini:ModelId"];
        if (!string.IsNullOrEmpty(singleModel) && !_modelIds.Contains(singleModel))
        {
            _modelIds.Insert(0, singleModel);
        }

        if (_modelIds.Count == 0)
        {
            throw new InvalidOperationException("Gemini ModelIds not configured.");
        }
    }

    public async Task<string> GenerateFarewellTextAsync(string userBurden)
    {
        var apiKey = _configuration["AI_APIs:Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            throw new InvalidOperationException("Gemini ApiKey not configured.");

        var prompt = $"User’s burden: '{userBurden}'. Write a short (max 2–3 sentences), poetic letter/response that helps them let go of this burden, in the peaceful, countercultural spirit of Bob Dylan’s 1973-era 'Knockin’ on Heaven’s Door'. Let the tone feel like a laid-back, hopeful 70s FM radio host.";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            }
        };

        var jsonPayload = JsonSerializer.Serialize(requestBody);

        Exception lastException = null;

        foreach (var modelId in _modelIds)
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent?key={apiKey}";
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errBody = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Gemini model {modelId} failed ({(int)response.StatusCode}), trying next... Body: {errBody[..Math.Min(200, errBody.Length)]}");
                    lastException = new HttpRequestException($"{(int)response.StatusCode} on {modelId}");
                    continue;
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseJson);
                var generatedText = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                Console.WriteLine($"Gemini model {modelId} succeeded.");
                return generatedText ?? "The radio signal weakened, amigo... Try tuning in again.";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Gemini model {modelId} exception: {ex.Message}");
                lastException = ex;
                continue;
            }
        }

        // all models failed
        Console.WriteLine("All Gemini models failed.");
        throw new Exception("All Gemini models are currently rate limited. Please try again later.", lastException);
    }
}