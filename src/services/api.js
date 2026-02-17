import axios from 'axios';

// NEW: Fetch and Parse into 3 Distinct Styles
export const fetchProductDescriptions = async (basePrompt) => {
  console.log('📝 Generating 3-style descriptions...');
  
  const strictPrompt = `${basePrompt}

IMPORTANT OUTPUT FORMAT:
You MUST provide the response in exactly these 3 sections. Do not add intro text.

SECTION 1: ANALYTICAL
(Write a detailed, feature-heavy, technical version here.)

SECTION 2: SIMPLIFIED
(Write a casual, easy-to-read, mass-market version here.)

SECTION 3: CRITICAL
(Write a hard-selling, persuasive, objection-handling version here.)`;

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const token = localStorage.getItem('tindahan_token');

const response = await axios.post('https://tindahan-ai-production.up.railway.app/api/compare', {
  question: strictPrompt
}, { 
  timeout: 60000,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

      if (!response.data.success) throw new Error('Backend Error');

      const fullText = response.data.data || "";

      return parseSections(fullText);

    } catch (error) {
  console.error(`Attempt ${attempt} failed:`, error);
  
  // Check if it's a usage limit error
  if (error.response?.status === 429) {
    throw new Error(error.response.data.message || 'Daily limit reached! Please upgrade your plan.');
  }
  
  if (attempt < maxRetries) await new Promise(r => setTimeout(r, 2000));
}
  }

  return getDemoProductDescriptions();
};

// PARSER
const parseSections = (text) => {
  const analyticalMatch = text.match(/SECTION 1: ANALYTICAL\s*([\s\S]*?)(?=SECTION 2:|$)/i);
  const simplifiedMatch = text.match(/SECTION 2: SIMPLIFIED\s*([\s\S]*?)(?=SECTION 3:|$)/i);
  const criticalMatch = text.match(/SECTION 3: CRITICAL\s*([\s\S]*?)(?=$)/i);

  const clean = (str) =>
    str ? str.trim().replace(/\*\*/g, '') : "Content generation failed.";

  return [
    {
      style: "ANALYTICAL",
      title: "Technical & Detailed",
      text: clean(analyticalMatch ? analyticalMatch[1] : text),
      icon: "📊",
      color: "#8b5cf6"
    },
    {
      style: "SIMPLIFIED",
      title: "Casual & Friendly",
      text: clean(simplifiedMatch ? simplifiedMatch[1] : ""),
      icon: "💡",
      color: "#10b981"
    },
    {
      style: "CRITICAL",
      title: "Persuasive & Viral",
      text: clean(criticalMatch ? criticalMatch[1] : ""),
      icon: "🔥",
      color: "#f43f5e"
    }
  ];
};

// DEMO MODE
const getDemoProductDescriptions = () => {
  return [
    {
      style: "ANALYTICAL",
      title: "Technical & Detailed",
      text: "Demo: High-spec features with technical explanation.",
      icon: "📊",
      color: "#8b5cf6"
    },
    {
      style: "SIMPLIFIED",
      title: "Casual & Friendly",
      text: "Demo: Madali gamitin at sulit sa araw-araw.",
      icon: "💡",
      color: "#10b981"
    },
    {
      style: "CRITICAL",
      title: "Persuasive & Viral",
      text: "Demo: Bakit mo kailangan ito? Dahil ito ang best choice sa price at quality.",
      icon: "🔥",
      color: "#f43f5e"
    }
  ];
};
