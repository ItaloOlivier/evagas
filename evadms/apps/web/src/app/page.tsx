'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    // Update copyright year
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
  }, []);

  return (
    <>
      {/* Landing page styles */}
      <link rel="stylesheet" href="/landing-styles.css" />

      {/* Skip Navigation for Accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Top Bar */}
      <div className="top-bar" role="banner">
        <div className="container">
          <div className="top-bar-content">
            <a href="tel:+27105992498" className="top-bar-item" aria-label="Call EVAGas at 010 599 2498">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>010 599 2498</span>
            </a>
            <a href="mailto:sales2@congassa.co.za" className="top-bar-item" aria-label="Email EVAGas">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>sales2@congassa.co.za</span>
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header" role="navigation" aria-label="Main navigation">
        <div className="container">
          <nav className="nav">
            <a href="/" className="logo" aria-label="EVAGas Home">
              <img src="/logo.jpg" alt="EVAGas - Evolved Energy" className="logo-image" width={180} />
            </a>
            <ul className="nav-links" role="menubar">
              <li role="none"><a href="#home" className="nav-link active" role="menuitem">Home</a></li>
              <li role="none"><a href="#about" className="nav-link" role="menuitem">About</a></li>
              <li role="none"><a href="#services" className="nav-link" role="menuitem">Services</a></li>
              <li role="none"><a href="#faq" className="nav-link" role="menuitem">FAQ</a></li>
              <li role="none"><a href="#contact" className="nav-link" role="menuitem">Contact</a></li>
              <li role="none" className="mobile-login-item"><a href="/app" className="btn btn-outline btn-block mobile-login-btn">Log In</a></li>
            </ul>
            <div className="nav-actions">
              <a href="/app" className="btn btn-outline nav-login">Log In</a>
              <a href="#contact" className="btn btn-primary nav-cta">Get a Quote</a>
            </div>
            <button className="mobile-menu-btn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-links">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <section id="home" className="hero" aria-labelledby="hero-title">
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-gradient"></div>
          </div>
          <div className="container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot" aria-hidden="true"></span>
                <span>Authorised Oryx LPG Supplier</span>
              </div>
              <h1 id="hero-title" className="hero-title">
                Gauteng &amp; North West&apos;s Trusted
                <span className="title-highlight">Bulk LPG Gas Supplier</span>
              </h1>
              <p className="hero-subtitle">
                Licensed bulk gas delivery, cylinder refilling, and wholesale LPG solutions for homes, businesses, and industries.
                <strong> Serving Gauteng, Hartbeespoort, Rustenburg &amp; Brits.</strong>
              </p>
              <div className="hero-actions">
                <a href="#contact" className="btn btn-primary btn-lg">
                  Request a Free Quote
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </a>
                <a href="https://wa.me/27105992498?text=Hi%20EVAGas%2C%20I%27d%20like%20to%20enquire%20about%20your%20LPG%20gas%20services." className="btn btn-whatsapp btn-lg" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Us
                </a>
                <a href="tel:+27105992498" className="btn btn-outline btn-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Call: 010 599 2498
                </a>
              </div>
              <div className="hero-stats" role="list" aria-label="Company highlights">
                <div className="stat" role="listitem">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Licensed &amp; Certified</span>
                </div>
                <div className="stat-divider" aria-hidden="true"></div>
                <div className="stat" role="listitem">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Customer Support</span>
                </div>
                <div className="stat-divider" aria-hidden="true"></div>
                <div className="stat" role="listitem">
                  <span className="stat-number">GP+NW</span>
                  <span className="stat-label">Regional Delivery</span>
                </div>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="tank-illustration">
                <svg viewBox="0 0 180 320" fill="none" className="gas-tank" role="img" aria-label="LPG Gas Tank Illustration">
                  <defs>
                    <linearGradient id="cylinderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#5a6474"/>
                      <stop offset="20%" stopColor="#8a949e"/>
                      <stop offset="40%" stopColor="#9aa4ae"/>
                      <stop offset="50%" stopColor="#b0bac4"/>
                      <stop offset="60%" stopColor="#9aa4ae"/>
                      <stop offset="80%" stopColor="#7a848e"/>
                      <stop offset="100%" stopColor="#4a545e"/>
                    </linearGradient>
                    <linearGradient id="domeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#6a747e"/>
                      <stop offset="50%" stopColor="#8a949e"/>
                      <stop offset="100%" stopColor="#5a646e"/>
                    </linearGradient>
                    <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6a747e"/>
                      <stop offset="100%" stopColor="#3a444e"/>
                    </linearGradient>
                    <linearGradient id="valveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c5a030"/>
                      <stop offset="30%" stopColor="#e8c84a"/>
                      <stop offset="50%" stopColor="#f5d85a"/>
                      <stop offset="70%" stopColor="#e8c84a"/>
                      <stop offset="100%" stopColor="#b59020"/>
                    </linearGradient>
                    <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4a545e"/>
                      <stop offset="50%" stopColor="#6a747e"/>
                      <stop offset="100%" stopColor="#4a545e"/>
                    </linearGradient>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7a848e"/>
                      <stop offset="50%" stopColor="#5a646e"/>
                      <stop offset="100%" stopColor="#4a545e"/>
                    </linearGradient>
                    <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.3)"/>
                      <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                    </linearGradient>
                  </defs>
                  <ellipse cx="90" cy="58" rx="42" ry="8" fill="url(#ringGradient)"/>
                  <rect x="48" y="50" width="84" height="12" fill="url(#ringGradient)"/>
                  <ellipse cx="90" cy="50" rx="42" ry="8" fill="#6a747e"/>
                  <path d="M55 45 Q55 20 90 20 Q125 20 125 45" stroke="url(#handleGradient)" strokeWidth="8" fill="none" strokeLinecap="round"/>
                  <rect x="80" y="28" width="20" height="22" rx="3" fill="url(#valveGradient)"/>
                  <ellipse cx="90" cy="28" rx="10" ry="3" fill="#d8b840"/>
                  <rect x="85" y="18" width="10" height="12" rx="2" fill="url(#valveGradient)"/>
                  <ellipse cx="90" cy="18" rx="5" ry="2" fill="#c5a030"/>
                  <ellipse cx="90" cy="12" rx="12" ry="4" fill="#2a2a2a"/>
                  <ellipse cx="90" cy="10" rx="12" ry="4" fill="#3a3a3a"/>
                  <ellipse cx="90" cy="10" rx="8" ry="2.5" fill="#1a1a1a"/>
                  <rect x="30" y="60" width="120" height="210" fill="url(#cylinderGradient)"/>
                  <ellipse cx="90" cy="60" rx="60" ry="18" fill="url(#domeGradient)"/>
                  <ellipse cx="90" cy="270" rx="60" ry="20" fill="url(#bottomGradient)"/>
                  <line x1="30" y1="100" x2="150" y2="100" stroke="#5a646e" strokeWidth="1.5"/>
                  <line x1="30" y1="230" x2="150" y2="230" stroke="#5a646e" strokeWidth="1.5"/>
                  <line x1="90" y1="60" x2="90" y2="270" stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
                  <ellipse cx="60" cy="160" rx="15" ry="80" fill="url(#highlightGradient)" opacity="0.5"/>
                  <rect x="35" y="115" width="110" height="85" fill="rgba(0,0,0,0.4)" rx="4"/>
                  <text x="90" y="145" textAnchor="middle" fill="#E63E2D" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">EVAGas</text>
                  <text x="90" y="185" textAnchor="middle" fill="#ffffff" fontSize="38" fontWeight="bold" fontFamily="Arial, sans-serif">LPG</text>
                  <ellipse cx="90" cy="285" rx="55" ry="12" fill="#3a444e"/>
                  <rect x="35" y="275" width="110" height="12" fill="#4a545e"/>
                  <ellipse cx="90" cy="275" rx="55" ry="10" fill="#5a646e"/>
                  <ellipse cx="90" cy="295" rx="50" ry="8" fill="rgba(0,0,0,0.2)"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>Scroll to explore</span>
            <div className="scroll-indicator">
              <div className="scroll-dot"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features" aria-labelledby="features-heading">
          <h2 id="features-heading" className="visually-hidden">Why Choose EVAGas</h2>
          <div className="container">
            <div className="features-grid">
              <article className="feature-card feature-card-primary">
                <div className="feature-icon" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2C12 2 6 8 6 13C6 16.3 8.7 19 12 19C15.3 19 18 16.3 18 13C18 8 12 2 12 2Z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </div>
                <h3 className="feature-title">Bulk LPG Supply</h3>
                <p className="feature-desc">Authorised Oryx bulk LPG refilling supplier with premium quality gas for industrial, commercial, and residential use.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <line x1="10" y1="14" x2="14" y2="14"/>
                  </svg>
                </div>
                <h3 className="feature-title">Wholesale Gas Distribution</h3>
                <p className="feature-desc">B2B and B2C wholesale LPG solutions with competitive bulk pricing and flexible delivery schedules across South Africa.</p>
              </article>
              <article className="feature-card">
                <div className="feature-icon" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                    <path d="M9 12L11 14L15 10"/>
                  </svg>
                </div>
                <h3 className="feature-title">LPGSA Certified &amp; Safe</h3>
                <p className="feature-desc">Fully licensed, LPGSA registered, and SANS10087 compliant. Safety and quality are our top priorities.</p>
              </article>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about" aria-labelledby="about-heading">
          <div className="container">
            <div className="about-grid">
              <div className="about-content">
                <span className="section-label">About EVAGas</span>
                <h2 id="about-heading" className="section-title">Your Trusted Partner for <span className="text-primary">LPG Gas in Gauteng &amp; North West</span></h2>
                <p className="about-text">
                  EVAGas is a legitimate authorised Oryx bulk LPG refilling supplier proudly serving Gauteng, Hartbeespoort, Rustenburg, and Brits.
                  With years of experience in the gas industry, we&apos;ve built our reputation on reliable delivery,
                  competitive pricing, and unwavering commitment to safety standards.
                </p>
                <p className="about-text">
                  Whether you need bulk LPG for your industrial operation, gas cylinder refills for your restaurant,
                  or home delivery for cooking and heating, EVAGas provides comprehensive solutions tailored to your needs.
                  Our qualified technicians are LPGSA registered and ensure every delivery meets SANS10087 safety requirements throughout the region.
                </p>
                <div className="about-features" role="list">
                  <div className="about-feature" role="listitem">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E63E2D" strokeWidth="2" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>LPGSA Licensed &amp; Registered</span>
                  </div>
                  <div className="about-feature" role="listitem">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E63E2D" strokeWidth="2" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>Gauteng &amp; North West Delivery</span>
                  </div>
                  <div className="about-feature" role="listitem">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E63E2D" strokeWidth="2" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>Competitive Bulk Pricing</span>
                  </div>
                  <div className="about-feature" role="listitem">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E63E2D" strokeWidth="2" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>SANS10087 Safety Compliant</span>
                  </div>
                </div>
              </div>
              <div className="about-visual">
                <div className="about-image">
                  <div className="about-tank-illustration" aria-hidden="true">
                    <svg viewBox="0 0 180 320" fill="none" className="about-gas-tank">
                      <defs>
                        <linearGradient id="aboutCylinderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#5a6474"/><stop offset="50%" stopColor="#b0bac4"/><stop offset="100%" stopColor="#4a545e"/>
                        </linearGradient>
                        <linearGradient id="aboutDomeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#6a747e"/><stop offset="100%" stopColor="#5a646e"/>
                        </linearGradient>
                        <linearGradient id="aboutBottomGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#6a747e"/><stop offset="100%" stopColor="#3a444e"/>
                        </linearGradient>
                      </defs>
                      <ellipse cx="90" cy="58" rx="42" ry="8" fill="#5a646e"/>
                      <rect x="48" y="50" width="84" height="12" fill="#5a646e"/>
                      <ellipse cx="90" cy="50" rx="42" ry="8" fill="#6a747e"/>
                      <path d="M55 45 Q55 20 90 20 Q125 20 125 45" stroke="#5a646e" strokeWidth="8" fill="none" strokeLinecap="round"/>
                      <rect x="80" y="28" width="20" height="22" rx="3" fill="#e8c84a"/>
                      <ellipse cx="90" cy="28" rx="10" ry="3" fill="#d8b840"/>
                      <rect x="85" y="18" width="10" height="12" rx="2" fill="#e8c84a"/>
                      <ellipse cx="90" cy="18" rx="5" ry="2" fill="#c5a030"/>
                      <ellipse cx="90" cy="12" rx="12" ry="4" fill="#2a2a2a"/>
                      <ellipse cx="90" cy="10" rx="12" ry="4" fill="#3a3a3a"/>
                      <rect x="30" y="60" width="120" height="210" fill="url(#aboutCylinderGradient)"/>
                      <ellipse cx="90" cy="60" rx="60" ry="18" fill="url(#aboutDomeGradient)"/>
                      <ellipse cx="90" cy="270" rx="60" ry="20" fill="url(#aboutBottomGradient)"/>
                      <line x1="30" y1="100" x2="150" y2="100" stroke="#5a646e" strokeWidth="1.5"/>
                      <line x1="30" y1="230" x2="150" y2="230" stroke="#5a646e" strokeWidth="1.5"/>
                      <rect x="35" y="115" width="110" height="85" fill="rgba(0,0,0,0.4)" rx="4"/>
                      <text x="90" y="145" textAnchor="middle" fill="#E63E2D" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">EVAGas</text>
                      <text x="90" y="185" textAnchor="middle" fill="#ffffff" fontSize="38" fontWeight="bold" fontFamily="Arial, sans-serif">LPG</text>
                      <ellipse cx="90" cy="285" rx="55" ry="12" fill="#3a444e"/>
                      <rect x="35" y="275" width="110" height="12" fill="#4a545e"/>
                      <ellipse cx="90" cy="275" rx="55" ry="10" fill="#5a646e"/>
                    </svg>
                  </div>
                  <div className="about-card">
                    <span className="about-card-number">10+</span>
                    <span className="about-card-text">Years Serving South Africa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="services" aria-labelledby="services-heading">
          <div className="container">
            <header className="section-header">
              <span className="section-label">Our LPG Services</span>
              <h2 id="services-heading" className="section-title">Comprehensive <span className="text-primary">Gas Solutions</span></h2>
              <p className="section-subtitle">From bulk industrial supply to residential cylinder delivery, we cover all your LPG needs</p>
            </header>
            <div className="services-grid">
              <article className="service-card">
                <div className="service-number" aria-hidden="true">01</div>
                <h3 className="service-title">Bulk LPG Gas Supply</h3>
                <p className="service-desc">Large-scale bulk LPG delivery via tanker trucks for industrial plants, manufacturing facilities, mining operations, and commercial businesses across South Africa.</p>
                <a href="#contact" className="service-link">Get Bulk Quote <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
              </article>
              <article className="service-card">
                <div className="service-number" aria-hidden="true">02</div>
                <h3 className="service-title">Gas Cylinder Refilling</h3>
                <p className="service-desc">Professional LPG cylinder refilling services for 9kg, 14kg, 19kg, and 48kg gas bottles. All cylinders undergo safety inspection before refilling.</p>
                <a href="#contact" className="service-link">Refill Enquiry <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
              </article>
              <article className="service-card">
                <div className="service-number" aria-hidden="true">03</div>
                <h3 className="service-title">Wholesale B2B Solutions</h3>
                <p className="service-desc">Dedicated wholesale LPG distribution for resellers, gas depots, and business customers. Volume discounts and dedicated account management.</p>
                <a href="#contact" className="service-link">Wholesale Pricing <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
              </article>
              <article className="service-card">
                <div className="service-number" aria-hidden="true">04</div>
                <h3 className="service-title">Home Gas Delivery</h3>
                <p className="service-desc">Convenient residential LPG gas delivery to your home. Perfect for cooking, braai, heating, and household appliances. Safe doorstep delivery.</p>
                <a href="#contact" className="service-link">Order Home Delivery <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="faq" aria-labelledby="faq-heading">
          <div className="container">
            <header className="section-header">
              <span className="section-label">Frequently Asked Questions</span>
              <h2 id="faq-heading" className="section-title">Common <span className="text-primary">Questions</span></h2>
              <p className="section-subtitle">Everything you need to know about EVAGas and our LPG services</p>
            </header>
            <div className="faq-grid">
              <details className="faq-item">
                <summary className="faq-question">What is EVAGas and what LPG services do you offer?</summary>
                <div className="faq-answer"><p>EVAGas is an authorised Oryx bulk LPG refilling supplier in South Africa. We offer bulk LPG supply, gas cylinder refilling (9kg, 19kg, 48kg sizes), wholesale distribution for resellers, and residential home delivery.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-question">What areas in South Africa does EVAGas deliver to?</summary>
                <div className="faq-answer"><p>EVAGas primarily services Gauteng, Hartbeespoort, Rustenburg, and Brits. We have strong coverage across Gauteng including Johannesburg, Pretoria, and the North West province.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-question">Is EVAGas a legitimate and licensed gas supplier?</summary>
                <div className="faq-answer"><p>Yes, EVAGas is fully licensed. We are an authorised Oryx LPG dealer and registered with the LPGSA. All operations comply with SANS10087 safety standards.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-question">What gas cylinder sizes can EVAGas refill?</summary>
                <div className="faq-answer"><p>EVAGas refills all standard LPG cylinder sizes including 9kg, 14kg, 19kg, and 48kg gas bottles with comprehensive safety inspections.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-question">How do I order bulk LPG gas from EVAGas?</summary>
                <div className="faq-answer"><p>Call us at 010 599 2498, email sales2@congassa.co.za, or complete our contact form. We offer competitive bulk pricing with flexible delivery scheduling.</p></div>
              </details>
              <details className="faq-item">
                <summary className="faq-question">Does EVAGas deliver gas cylinders to homes?</summary>
                <div className="faq-answer"><p>Yes, EVAGas provides residential home delivery throughout Gauteng, Hartbeespoort, Rustenburg, and Brits. Contact us to schedule delivery.</p></div>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta" aria-labelledby="cta-heading">
          <div className="container">
            <div className="cta-content">
              <h2 id="cta-heading" className="cta-title">Ready to Order LPG Gas?</h2>
              <p className="cta-text">Contact EVAGas today for a free quote on bulk gas supply, cylinder refilling, or home delivery.</p>
              <div className="cta-actions">
                <a href="#contact" className="btn btn-white btn-lg">Get Your Free Quote</a>
                <a href="tel:+27105992498" className="btn btn-outline-white btn-lg">Call: 010 599 2498</a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact" aria-labelledby="contact-heading">
          <div className="container">
            <div className="contact-grid">
              <div className="contact-info">
                <span className="section-label">Get In Touch</span>
                <h2 id="contact-heading" className="section-title">Contact <span className="text-primary">EVAGas</span></h2>
                <p className="contact-text">Ready to place an order or have questions about our LPG services? Our team is here to help.</p>
                <address className="contact-details">
                  <div className="contact-item">
                    <div className="contact-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    <div><h3>Phone</h3><a href="tel:+27105992498">010 599 2498</a></div>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                    <div><h3>Email</h3><a href="mailto:sales2@congassa.co.za">sales2@congassa.co.za</a></div>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                    <div><h3>Service Area</h3><span>Gauteng, Hartbeespoort, Rustenburg &amp; Brits</span></div>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                    <div><h3>Business Hours</h3><span>Mon-Fri: 7AM-5PM | Sat: 8AM-1PM</span></div>
                  </div>
                </address>
              </div>
              <div className="contact-form-wrapper">
                <form className="contact-form" id="contactForm">
                  <div className="form-group">
                    <label htmlFor="name">Full Name <span className="required">*</span></label>
                    <input type="text" id="name" name="name" placeholder="Your full name" required autoComplete="name" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email <span className="required">*</span></label>
                      <input type="email" id="email" name="email" placeholder="your@email.com" required autoComplete="email" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone</label>
                      <input type="tel" id="phone" name="phone" placeholder="012 345 6789" autoComplete="tel" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="service">Service Required</label>
                    <select id="service" name="service">
                      <option value="">Select a service</option>
                      <option value="bulk-lpg">Bulk LPG Supply</option>
                      <option value="cylinder-refill">Cylinder Refilling</option>
                      <option value="wholesale">Wholesale / B2B</option>
                      <option value="home-delivery">Home Delivery</option>
                      <option value="other">Other Enquiry</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" rows={4} placeholder="Tell us about your gas requirements..."></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-block">
                    Send Enquiry
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <a href="/" className="logo footer-logo">
                <img src="/logo.jpg" alt="EVAGas - Evolved Energy" className="logo-image footer-logo-image" width={200} />
              </a>
              <p className="footer-tagline">Authorised Oryx bulk LPG refilling supplier serving Gauteng, Hartbeespoort, Rustenburg &amp; Brits.</p>
            </div>
            <nav className="footer-links" aria-label="Quick Links">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About EVAGas</a></li>
                <li><a href="#services">LPG Services</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
            </nav>
            <nav className="footer-links" aria-label="Services">
              <h4>Our Services</h4>
              <ul>
                <li><a href="#services">Bulk LPG Supply</a></li>
                <li><a href="#services">Cylinder Refilling</a></li>
                <li><a href="#services">Wholesale Distribution</a></li>
                <li><a href="#services">Home Gas Delivery</a></li>
              </ul>
            </nav>
            <div className="footer-contact">
              <h4>Contact EVAGas</h4>
              <ul>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><a href="tel:+27105992498">010 599 2498</a></li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><a href="mailto:sales2@congassa.co.za">sales2@congassa.co.za</a></li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>Gauteng, Hartbeespoort, Rustenburg &amp; Brits</span></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; <span id="currentYear">{new Date().getFullYear()}</span> EVAGas South Africa. All rights reserved.</p>
            <p>Authorised Oryx LPG Supplier | LPGSA Registered</p>
          </div>
        </div>
      </footer>

      {/* Schema.org JSON-LD */}
      <Script id="schema-local-business" type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "EVAGas",
        "description": "EVAGas is an authorised Oryx bulk LPG refilling supplier serving Gauteng, Hartbeespoort, Rustenburg, and Brits.",
        "url": "https://evagas.co.za",
        "telephone": "+27105992498",
        "email": "sales2@congassa.co.za",
        "areaServed": ["Gauteng", "North West", "Hartbeespoort", "Rustenburg", "Brits"],
        "openingHoursSpecification": [
          {"dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "07:00", "closes": "17:00"},
          {"dayOfWeek": "Saturday", "opens": "08:00", "closes": "13:00"}
        ]
      })}} />

      {/* Landing page scripts */}
      <Script src="/landing-script.js" strategy="lazyOnload" />
    </>
  );
}
