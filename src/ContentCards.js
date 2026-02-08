import React from 'react';
import Card from '../ui/Card';
import './cards.css';

const ContentCards = () => {
  const cards = [
    {
      title: "WHAT IS AI?",
      description: "A comprehensive guide to understanding AI from the ground up."
    },
    {
      title: "FEATURED TOPIC",
      description: "Latest developments and trends in artificial intelligence."
    },
    {
      title: "POPULAR TOOLS",
      description: "Discover the platforms shaping the future of technology."
    }
  ];

  return (
    <div className="content-grid">
      {cards.map((card, index) => (
        <Card 
          key={index}
          title={card.title}
          description={card.description}
          className="content-card"
        />
      ))}
    </div>
  );
};

export default ContentCards;