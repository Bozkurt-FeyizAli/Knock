using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace backend.Services
{
    public class SentimentAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public SentimentAnalysisService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> AnalyzeSentimentAsync(string text)
        {
            var apiKey = _configuration["AI_APIs:Gemini:ApiKey"];
            var modelId = _configuration["AI_APIs:Gemini:ModelId"];
            
            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(modelId))
            {
                throw new Exception("Gemini API config eksik.");
            }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent?key={apiKey}";

            var prompt = $"Aşağıdaki metnin duygu durumunu analiz et. Sadece 'POSITIVE' veya 'NEGATIVE' kelimesiyle yanıt ver: {text}";

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

                var result = generatedText?.Trim().ToUpper() ?? "POSITIVE";
                if (result.Contains("NEGATIVE")) return "NEGATIVE";
                return "POSITIVE";
            }
            catch(Exception ex)
            {
                Console.WriteLine($"Sentiment Parse Hatası: {ex.Message}");
                return "POSITIVE";
            }
        }
    }
}
