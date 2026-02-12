import axios from 'axios';

// Configuration for text limits
const TEXT_LIMITS = {
  questionMax: 500,
  responseMax: 800,
  showTruncated: true
};

// NEW: Fetch product descriptions
export const fetchProductDescriptions = async (prompt) => {
  console.log('📝 Generating product descriptions...');
  
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Calling backend API... (Attempt ${attempt}/${maxRetries})`);
      
      const response = await axios.post('/api/compare', {
        question: prompt
      }, {
        timeout: 60000
      });

      if (!response.data.success) {
        throw new Error('Failed to get response from Deepseek');
      }

      console.log('✅ Backend API Success!');
      const responseText = response.data.data;
      
      return parseProductDescriptions(responseText);
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying... (${maxRetries - attempt} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log('🔄 All retries failed, falling back to demo');
  return getDemoProductDescriptions();
};

// Parse Deepseek response into product descriptions
const parseProductDescriptions = (responseText) => {
  console.log('🔍 Parsing product descriptions...');
  
  const sections = {
    seo: extractSection(responseText, ['SEO', '1.', 'seo-focused', 'keyword']),
    benefit: extractSection(responseText, ['BENEFIT', '2.', 'benefit-driven', 'value']),
    emotional: extractSection(responseText, ['EMOTIONAL', '3.', 'emotion', 'desire', 'urgent'])
  };
  
  // If parsing fails, split response into thirds
  if (!sections.seo || !sections.benefit || !sections.emotional) {
    console.log('⚠️ Could not parse all sections, using fallback');
    const third = Math.floor(responseText.length / 3);
    return [
      {
        name: 'SEO-Focused',
        description: 'Optimized for search rankings',
        color: '#10b981',
        icon: '🔍',
        text: cleanDescription(responseText.substring(0, third))
      },
      {
        name: 'Benefit-Driven',
        description: 'Highlights customer value',
        color: '#6a5cff',
        icon: '⭐',
        text: cleanDescription(responseText.substring(third, third * 2))
      },
      {
        name: 'Emotional Appeal',
        description: 'Creates desire and urgency',
        color: '#ff4fd8',
        icon: '💝',
        text: cleanDescription(responseText.substring(third * 2))
      }
    ];
  }
  
  return [
    {
      name: 'SEO-Focused',
      description: 'Optimized for search rankings',
      color: '#10b981',
      icon: '🔍',
      text: cleanDescription(sections.seo)
    },
    {
      name: 'Benefit-Driven',
      description: 'Highlights customer value',
      color: '#6a5cff',
      icon: '⭐',
      text: cleanDescription(sections.benefit)
    },
    {
      name: 'Emotional Appeal',
      description: 'Creates desire and urgency',
      color: '#ff4fd8',
      icon: '💝',
      text: cleanDescription(sections.emotional)
    }
  ];
};

// Clean up description text
const cleanDescription = (text) => {
  return text
    .replace(/###\s*\[.*?\]/g, '') // Remove section headers
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/^\d+\.\s*/gm, '') // Remove numbered lists
    .trim();
};

// Helper to extract section from response
const extractSection = (text, keywords) => {
  const lines = text.split('\n');
  let inSection = false;
  let sectionText = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (keywords.some(keyword => line.includes(keyword.toLowerCase()))) {
      if (inSection) break;
      inSection = true;
      continue;
    }
    
    if (inSection) {
      if (sectionText.length === 0 && !line.trim()) {
        continue;
      }
      sectionText.push(lines[i]);
      
      if (i + 1 < lines.length && 
          (lines[i + 1].match(/^\d+\./) || 
           lines[i + 1].match(/^###/) ||
           lines[i + 1].toUpperCase() === lines[i + 1])) {
        break;
      }
    }
  }
  
  return sectionText.join('\n').trim() || null;
};

// Demo product descriptions (fallback)
const getDemoProductDescriptions = () => {
  console.log('🎭 Generating demo descriptions...');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          name: 'SEO-Focused',
          description: 'Optimized for search rankings',
          color: '#10b981',
          icon: '🔍',
          text: '[DEMO MODE] Backend server may not be running. This is an example SEO-optimized description with keywords. Premium wireless earbuds with noise cancellation, long battery life, and crystal-clear sound quality. Perfect for music lovers, gym enthusiasts, and professionals.'
        },
        {
          name: 'Benefit-Driven',
          description: 'Highlights customer value',
          color: '#6a5cff',
          icon: '⭐',
          text: '[DEMO MODE] Example benefit-focused description. Experience music like never before with our premium earbuds. Save time with fast charging, enjoy all-day comfort, and never miss a beat with superior sound quality.'
        },
        {
          name: 'Emotional Appeal',
          description: 'Creates desire and urgency',
          color: '#ff4fd8',
          icon: '💝',
          text: '[DEMO MODE] Example emotional description. Transform your daily routine into an extraordinary experience. Limited stock available - join thousands of happy customers who made the switch. Your ears deserve the best!'
        }
      ]);
    }, 800);
  });
};

// KEEP ORIGINAL FUNCTION FOR BACKWARD COMPATIBILITY
export const fetchAIResponse = async (question) => {
  console.log('📝 Processing question:', question.substring(0, 50));
  
  if (question.length > TEXT_LIMITS.questionMax) {
    throw new Error(`Question must be under ${TEXT_LIMITS.questionMax} characters`);
  }
  
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Calling backend API... (Attempt ${attempt}/${maxRetries})`);
      
      const response = await axios.post('/api/compare', {
        question
      }, {
        timeout: 60000
      });

      if (!response.data.success) {
        throw new Error('Failed to get response from Deepseek');
      }

      console.log('✅ Backend API Success!');
      const responseText = response.data.data;
      
      return parseDeepseekResponse(responseText, question);
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying... (${maxRetries - attempt} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log('🔄 All retries failed, falling back to demo');
  return getEnhancedDemoResponses(question);
};

const truncateText = (text, maxLength = TEXT_LIMITS.responseMax) => {
  if (text.length <= maxLength) return text;
  
  let truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const lastBreak = Math.max(lastPeriod, lastNewline);
  
  if (lastBreak > maxLength * 0.7) {
    truncated = truncated.substring(0, lastBreak + 1);
  }
  
  if (TEXT_LIMITS.showTruncated) {
    truncated += ' ...';
  }
  
  return truncated;
};

const parseDeepseekResponse = (responseText, question) => {
  console.log('🔍 Parsing Deepseek response...');
  
  const sections = {
    analytical: extractSection(responseText, ['ANALYTICAL', '1.', 'analytical']),
    simplified: extractSection(responseText, ['SIMPLIFIED', '2.', 'simplified', 'simple']),
    critical: extractSection(responseText, ['CRITICAL', '3.', 'critical'])
  };
  
  if (!sections.analytical || !sections.simplified || !sections.critical) {
    console.log('⚠️ Could not parse all sections, using fallback');
    const third = Math.floor(responseText.length / 3);
    return [
      {
        name: 'Analytical Perspective',
        description: 'Data-driven, logical reasoning',
        color: '#6a5cff',
        icon: '📊',
        text: truncateText(responseText.substring(0, third) || `Analytical analysis: ${question}`)
      },
      {
        name: 'Simplified Perspective',
        description: 'Plain language, beginner-friendly',
        color: '#00e5ff',
        icon: '💡',
        text: truncateText(responseText.substring(third, third * 2) || `Simple explanation: ${question}`)
      },
      {
        name: 'Critical Perspective',
        description: 'Question assumptions, explore nuances',
        color: '#ff4fd8',
        icon: '🔍',
        text: truncateText(responseText.substring(third * 2) || `Critical view: ${question}`)
      }
    ];
  }
  
  return [
    {
      name: 'Analytical Perspective',
      description: 'Data-driven, logical reasoning',
      color: '#6a5cff',
      icon: '📊',
      text: truncateText(sections.analytical)
    },
    {
      name: 'Simplified Perspective',
      description: 'Plain language, beginner-friendly',
      color: '#00e5ff',
      icon: '💡',
      text: truncateText(sections.simplified)
    },
    {
      name: 'Critical Perspective',
      description: 'Question assumptions, explore nuances',
      color: '#ff4fd8',
      icon: '🔍',
      text: truncateText(sections.critical)
    }
  ];
};

const getEnhancedDemoResponses = (question) => {
  console.log('🎭 Generating enhanced demo responses...');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          name: 'Analytical Perspective',
          description: 'Data-driven, logical reasoning',
          color: '#6a5cff',
          icon: '📊',
          text: `[DEMO MODE] Backend server may not be running. Analytical view of: "${question}"`
        },
        {
          name: 'Simplified Perspective',
          description: 'Plain language, beginner-friendly',
          color: '#00e5ff',
          icon: '💡',
          text: `[DEMO MODE] Simple explanation of: "${question}"`
        },
        {
          name: 'Critical Perspective',
          description: 'Question assumptions, explore nuances',
          color: '#ff4fd8',
          icon: '🔍',
          text: `[DEMO MODE] Critical view: "${question}"`
        }
      ]);
    }, 800);
  });
};

export { TEXT_LIMITS };