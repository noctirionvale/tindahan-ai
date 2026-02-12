import React from 'react';
import Hero from './components/Hero';
import ProductDescriptionGenerator from './components/ProductDescriptionGenerator';
import Analytics from './components/Analytics';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  return (
    <div className="main-wrapper">
      <main className="content-center">
        
        {/* Logo */}
        <div className="logo-container">
          <img src="pointingai.png" alt="Tindahan.AI Logo" className="logo-image" />
        </div>

        {/* Hero Section */}
        <Hero />
        
        {/* Product Description Generator - Main Tool */}
        <ProductDescriptionGenerator />

        {/* Analytics Dashboard */}
        <Analytics />

        {/* Pricing Section */}
        <Pricing />

        {/* Footer */}
        <Footer />
        
      </main>
    </div>
  );
}

export default App;