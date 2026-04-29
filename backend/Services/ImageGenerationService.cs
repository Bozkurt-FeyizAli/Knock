using System;
using System.Net.Http;
using System.Net.Http.Headers;
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

        public async Task<string> GenerateImageBase64Async(string prompt)
        {
            var apiKey = _configuration["AI_APIs:StabilityAI:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                Console.WriteLine("Warning: StabilityAI ApiKey is missing from appsettings.json.");
            }

            var url = "https://api.stability.ai/v2beta/stable-image/generate/core";
            
            // Append 1970s polaroid style to prompt
            var styledPrompt = $"1970s vintage polaroid photo, moody lighting, analog photography, {prompt}";

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Headers.Add("Accept", "image/*");

            using var content = new MultipartFormDataContent();
            content.Add(new StringContent(styledPrompt), "\"prompt\"");
content.Add(new StringContent("webp"), "\"output_format\"");
            
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
