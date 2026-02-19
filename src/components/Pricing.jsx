// UPDATE YOUR EXISTING Pricing.jsx - Change the plans array:

const plans = [
  {
    name: 'Free',
    phpPrice: 0,
    period: 'forever',
    description: 'Try Tindahan.AI - no credit card needed!',
    features: [
      '15 lifetime description generations',
      '1 lifetime video generation',
      'All 6 platform formats',
      'Copy to clipboard',
      'Basic support'
    ],
    cta: 'Start Free',
    ctaLink: '#product-generator',
    popular: false,
    color: '#64748b',
    isUpgrade: false
  },
  {
    name: 'Starter',
    phpPrice: 450,  // 25% cheaper than Photoroom (₱600)
    period: 'per month',
    description: 'For active sellers who need more content',
    features: [
      '200 description generations/month',
      '10 video generations/month',
      'All 6 platform formats',
      'Generation history',
      'Export to CSV',
      'Priority support'
    ],
    cta: 'Upgrade Now',
    popular: true,
    color: '#ff6b35',
    isUpgrade: true
  },
  {
    name: 'Premium',
    phpPrice: 5000,
    period: 'per month',
    description: 'For power sellers & growing businesses',
    features: [
      'Unlimited descriptions',
      'Unlimited videos',
      'All 6 platform formats',
      'Bulk generation',
      'Analytics dashboard',
      'API access',
      'Custom templates',
      'Priority support'
    ],
    cta: 'Upgrade Now',
    popular: false,
    color: '#8b5cf6',
    isUpgrade: true
  }
];