import axios from 'axios';

// NEW: Fetch product descriptions (Simplified for Tindahan)
export const fetchProductDescriptions = async (prompt) => {
  console.log('📝 Generating product description...');
  
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // NOTE: Ensure your backend endpoint /api/compare is actually running
      // If you are using a direct DeepSeek integration, this URL might need changing.
      // For now, we assume the Vercel backend is handling the key.
      const response = await axios.post('/api/compare', {
        question: prompt
      }, {
        timeout: 60000
      });

      if (!response.data.success) {
        throw new Error('Failed to get response from backend');
      }

      const responseText = response.data.data;
      
      // Stop parsing sections! Just return the clean text.
      return [{
        text: cleanDescription(responseText),
        name: "Generated Description",
        icon: "✨",
        color: "#10b981"
      }];
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // Fallback if API fails
  return getDemoProductDescriptions();
};

// Simple cleaner
const cleanDescription = (text) => {
  return text
    .replace(/###\s*\[.*?\]/g, '') 
    .replace(/\*\*/g, '') 
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .trim();
};

// Fallback Demo Data (Professional Taglish)
const getDemoProductDescriptions = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          text: "[DEMO MODE: API Error] 🔴 Connectivity Issue. \n\nAng Product na ito ay perfect para sa daily use! Siguradong matibay at sulit ang pera mo. Subukan na para maniwala! (Please check your API Key)",
          name: "System Offline",
          icon: "⚠️",
          color: "#ff6b6b"
        }
      ]);
    }, 800);
  });
};