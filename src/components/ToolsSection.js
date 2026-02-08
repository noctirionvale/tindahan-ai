import React from 'react';

const ToolsSection = () => {
  const aiAssistants = [
    { name: 'Grok', url: 'https://grok.com', desc: 'Alternative viewpoints and challenging assumptions', color: 'grok' },
    { name: 'ChatGPT', url: 'https://chat.openai.com', desc: 'General explanations and structured answers', color: 'chatgpt' },
    { name: 'Gemini', url: 'https://gemini.google.com', desc: 'Broad knowledge and access to recent information', color: 'gemini' },
    { name: 'DeepSeek', url: 'https://chat.deepseek.com', desc: 'Technical and analytical responses', color: 'deepseek' },
    { name: 'Claude', url: 'https://claude.ai', desc: 'Clear, thoughtful writing and summaries', color: 'claude' },
    { name: 'Qwen', url: 'https://chat.qwen.ai', desc: 'Multilingual reasoning and diverse perspectives', color: 'qwen' }
  ];

  const factChecking = [
    { name: 'Perplexity', url: 'https://www.perplexity.ai', desc: 'Source-backed answers and live information', color: 'perplexity' },
    { name: 'Google', url: 'https://www.google.com', desc: 'Discovering additional sources and viewpoints', color: 'google' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org', desc: 'Background knowledge and established facts', color: 'wiki' }
  ];

  return (
    <div id="tools-section" className="tools-section">
      <div className="section-header">
        <h2>Confused? Compare Sources.</h2>
        <p>The best way to demystify AI is to interact with it. Here are commonly used global anchors:</p>
      </div>

      <div className="tool-category">
        <h3 className="category-title">AI Assistants (for explanations, ideas, and perspectives)</h3>
        <div className="tool-grid">
          {aiAssistants.map((tool, index) => (
            <a key={index} href={tool.url} target="_blank" rel="noopener noreferrer" className={`tool-card tool-${tool.color}`}>
              <h4>{tool.name}</h4>
              <p>{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="tool-category">
        <h3 className="category-title">Fact-Checking and Research</h3>
        <div className="tool-grid">
          {factChecking.map((tool, index) => (
            <a key={index} href={tool.url} target="_blank" rel="noopener noreferrer" className={`tool-card tool-${tool.color}`}>
              <h4>{tool.name}</h4>
              <p>{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsSection;