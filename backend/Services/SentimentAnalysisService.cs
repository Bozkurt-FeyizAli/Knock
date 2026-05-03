using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using VaderSharp2;

namespace backend.Services
{
    public class SentimentAnalysisService
    {
        public SentimentAnalysisService()
        {
        }

        public Task<string> AnalyzeSentimentAsync(string userBurden)
        {
            var analyzer = new SentimentIntensityAnalyzer();
            var results = analyzer.PolarityScores(userBurden);
            
            // Compound value is between -1 (Very Negative) and +1 (Very Positive).
            if (results.Compound <= -0.05) return Task.FromResult("NEGATIVE");
            if (results.Compound >= 0.05) return Task.FromResult("POSITIVE");
            return Task.FromResult("NEUTRAL");
        }
    }
}
