using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System;

namespace backend.Services
{
    public class ElevenLabsAudioService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ElevenLabsAudioService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> GenerateAudioBase64Async(string text, string sentiment)
        {
            var apiKey = _configuration["AI_APIs:ElevenLabs:ApiKey"];
            
            var voiceId = _configuration["AI_APIs:ElevenLabs:VoiceId"];
            var baseUrl = _configuration["AI_APIs:ElevenLabs:Url"];

            if(string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(voiceId) || string.IsNullOrEmpty(baseUrl)) {
                throw new Exception("ElevenLabs config eksik.");
            }

            // Endpoint: https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
            var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}{voiceId}");
            
            // ElevenLabs API'si anahtarı xi-api-key header'ında bekler
            request.Headers.Add("xi-api-key", apiKey);
            request.Headers.Add("accept", "audio/mpeg");

            // İstek gövdesi (Payload)
            var payload = new
            {
                text = text,
                model_id = "eleven_multilingual_v2",
                voice_settings = new 
                { 
                    stability = 0.5, 
                    similarity_boost = 0.75 
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            request.Content = jsonContent;

            // İsteği gönder
            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"ElevenLabs API Hatası: {response.StatusCode} - {errorMsg}");
                return string.Empty; // Return empty instead of throwing to prevent backend crash if audio fails
            }

            // Dönen MP3 ses dosyasını byte dizisine çevir ve Base64 olarak döndür (Frontend için)
            var audioBytes = await response.Content.ReadAsByteArrayAsync();
            return Convert.ToBase64String(audioBytes);
        }
    }
}
