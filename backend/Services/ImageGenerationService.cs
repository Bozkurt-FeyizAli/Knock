using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace backend.Services
{
    public class ImageGenerationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ImageGenerationService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> GenerateImageBase64Async(string prompt, string sentiment = "NEUTRAL")
        {
            var apiKey = _configuration["AI_APIs:StabilityAI:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                Console.WriteLine("Warning: StabilityAI ApiKey is missing from appsettings.json.");
            }

            var url = "https://api.stability.ai/v2beta/stable-image/generate/core";

            // Duyguya özgü atmosfer tanımlayıcısı
            var moodDescriptor = sentiment.ToUpper() switch
            {
                "NEGATIVE" => "dim, melancholic, rainy window, cold blue tint, lonely, desolate",
                "POSITIVE" => "warm sunrise, hopeful, golden hour, soft bokeh, gentle light, serene",
                _          => "quiet afternoon, nostalgic, faded colors, still life, timeless"
            };

            // Stil odaklı prompt — fotoğraf makinesi çizdirmez
            var styledPrompt = $"1970s polaroid-style image, faded analog film colors, white polaroid frame, soft film grain, moody lighting, {moodDescriptor}, {prompt}";

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Headers.Add("Accept", "image/*");

            // Ham multipart/form-data gövdesi (name parametreleri tırnak içinde)
            var boundary = "----FormBoundary" + Guid.NewGuid().ToString("N");
            var rawBody =
                $"--{boundary}\r\n" +
                $"Content-Disposition: form-data; name=\"prompt\"\r\n\r\n" +
                $"{styledPrompt}\r\n" +
                $"--{boundary}\r\n" +
                $"Content-Disposition: form-data; name=\"output_format\"\r\n\r\n" +
                $"webp\r\n" +
                $"--{boundary}--\r\n";

            var content = new StringContent(rawBody, Encoding.UTF8);
            content.Headers.ContentType = MediaTypeHeaderValue.Parse($"multipart/form-data; boundary={boundary}");

            request.Content = content;

            try
            {
                var response = await _httpClient.SendAsync(request);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Image Generation API Error: {response.StatusCode} - {errorMsg}");
                    return string.Empty;
                }

                var imageBytes = await response.Content.ReadAsByteArrayAsync();
                return Convert.ToBase64String(imageBytes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Image Generation Exception: {ex.Message}");
                return string.Empty;
            }
        }
    }
}