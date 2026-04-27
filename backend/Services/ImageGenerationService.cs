using System;
using System.Net.Http;
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
            // Append 1970s polaroid style to prompt
            var styledPrompt = $"1970s vintage polaroid photo, moody lighting, analog photography, {prompt}";
            var encodedPrompt = Uri.EscapeDataString(styledPrompt);
            var url = $"https://image.pollinations.ai/prompt/{encodedPrompt}?width=512&height=512&nologo=true";

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Accept", "image/jpeg");

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Image Generation API Hatası: {response.StatusCode} - {errorMsg}");
                    return string.Empty; // Return empty to not break the frontend
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
