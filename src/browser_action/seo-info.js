/*
 SEO Information Module
 Extracts and analyzes SEO-related data from the current page
*/

export class SEOInfo {
  static async load(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Get active tab to extract SEO information
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        throw new Error('Unable to access current tab');
      }

      // Execute script in the page to extract SEO data
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractSEOData,
      });

      if (!results || !results[0]) {
        throw new Error('Unable to extract SEO data');
      }

      const seoData = results[0].result;

      // Load external metrics in parallel (non-blocking)
      const externalMetrics = await loadExternalMetrics(url, domain);

      // Calculate SEO Score
      const seoScore = calculateSEOScore(seoData, externalMetrics);

      // Return formatted SEO information
      return {
        domain: domain,
        url: url,
        title: seoData.title || 'Not found',
        titleLength: seoData.title ? seoData.title.length : 0,
        description: seoData.description || 'Not found',
        descriptionLength: seoData.description ? seoData.description.length : 0,
        keywords: seoData.keywords || 'Not found',
        canonical: seoData.canonical || 'Not found',
        robots: seoData.robots || 'Not found',
        ogTitle: seoData.ogTitle || 'Not found',
        ogDescription: seoData.ogDescription || 'Not found',
        ogImage: seoData.ogImage || 'Not found',
        ogType: seoData.ogType || 'Not found',
        twitterCard: seoData.twitterCard || 'Not found',
        twitterTitle: seoData.twitterTitle || 'Not found',
        twitterDescription: seoData.twitterDescription || 'Not found',
        twitterImage: seoData.twitterImage || 'Not found',
        h1Count: seoData.h1Count || 0,
        h2Count: seoData.h2Count || 0,
        imagesCount: seoData.imagesCount || 0,
        imagesWithoutAlt: seoData.imagesWithoutAlt || 0,
        linksInternal: seoData.linksInternal || 0,
        linksExternal: seoData.linksExternal || 0,
        hasSchema: seoData.hasSchema ? 'Yes' : 'No',
        schemaTypes: seoData.schemaTypes || 'None',
        viewport: seoData.viewport || 'Not found',
        language: seoData.language || 'Not found',
        charset: seoData.charset || 'Not found',
        // SEO Score calculations
        seoScore: seoScore,
        issues: identifySEOIssues(seoData, externalMetrics),
        // External metrics
        ...externalMetrics,
      };
    } catch (error) {
      console.error('SEO Info error:', error);
      throw new Error(error.message || 'Failed to load SEO information');
    }
  }
}

// Load external metrics from various APIs
async function loadExternalMetrics(url, domain) {
  const metrics = {
    // Security & Performance
    httpsEnabled: 'Checking...',
    hsts: 'Checking...',
    contentSecurityPolicy: 'Checking...',
    xFrameOptions: 'Checking...',
    
    // Domain Metrics
    domainAuthority: 'Calculating...',
    domainRating: 'Calculating...',
    
    // Performance
    performanceScore: 'Loading...',
    
    // Additional metrics
    backlinksEstimate: 'Calculating...',
    domainAge: 'Estimating...',
  };

  try {
    // Load all metrics in parallel with timeout
    const results = await Promise.allSettled([
      loadMozillaObservatory(domain),
      loadDomainMetrics(domain, url),
      extractSecurityFromPage(url),
    ]);

    // Process Mozilla Observatory results (for security headers)
    if (results[0].status === 'fulfilled' && results[0].value) {
      const mozData = results[0].value;
      metrics.httpsEnabled = mozData.https ? 'Yes' : 'No';
      metrics.hsts = mozData.hsts ? 'Enabled' : 'Not configured';
      metrics.contentSecurityPolicy = mozData.csp ? 'Configured' : 'Not configured';
      metrics.xFrameOptions = mozData.xfo ? 'Configured' : 'Not configured';
    }

    // Process Domain Metrics results
    if (results[1].status === 'fulfilled' && results[1].value) {
      const domainData = results[1].value;
      metrics.domainAuthority = domainData.domainAuthority || 'N/A';
      metrics.domainRating = domainData.domainRating || 'N/A';
      metrics.backlinksEstimate = domainData.backlinksEstimate || 'N/A';
      metrics.domainAge = domainData.domainAge || 'Unknown';
      metrics.performanceScore = domainData.performanceScore || 'See Web Vitals tab';
    }

    // Process page security extraction
    if (results[2].status === 'fulfilled' && results[2].value) {
      const pageData = results[2].value;
      if (metrics.httpsEnabled === 'Checking...') {
        metrics.httpsEnabled = pageData.https ? 'Yes' : 'No';
      }
    }

    // Calculate Domain Authority if not already set
    if (metrics.domainAuthority === 'Calculating...') {
      metrics.domainAuthority = calculateDomainAuthority(metrics, domain);
    }
    
    // Calculate Domain Rating if not already set
    if (metrics.domainRating === 'Calculating...') {
      metrics.domainRating = calculateDomainRating(metrics, domain);
    }

  } catch (error) {
    console.error('Error loading external metrics:', error);
    // Set default values on error
    metrics.domainAuthority = 'Unavailable';
    metrics.domainRating = 'Unavailable';
  }

  return metrics;
}

// Mozilla Observatory API (for security headers only)
async function loadMozillaObservatory(domain) {
  try {
    // First, initiate a scan
    const scanResponse = await fetch(`https://http-observatory.security.mozilla.org/api/v1/analyze?host=${domain}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!scanResponse.ok) throw new Error('Observatory scan failed');
    
    // Wait a bit for scan to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get results
    const resultResponse = await fetch(`https://http-observatory.security.mozilla.org/api/v1/analyze?host=${domain}`);
    
    if (!resultResponse.ok) throw new Error('Observatory results failed');
    
    const data = await resultResponse.json();
    
    return {
      https: data.tests_passed >= 1,
      hsts: data.tests?.['strict-transport-security']?.pass || false,
      csp: data.tests?.['content-security-policy']?.pass || false,
      xfo: data.tests?.['x-frame-options']?.pass || false,
    };
  } catch (error) {
    console.warn('Mozilla Observatory error:', error);
    return null;
  }
}

// Load Domain Metrics (Authority, Rating, Backlinks)
async function loadDomainMetrics(domain, url) {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    
    // Calculate Domain Authority based on multiple factors
    const da = calculateDomainAuthorityScore(domain, protocol);
    
    // Calculate Domain Rating based on different factors
    const dr = calculateDomainRatingScore(domain, protocol);
    
    // Estimate backlinks based on domain characteristics
    const backlinks = estimateBacklinks(domain, da, dr);
    
    // Estimate domain age (rough estimation based on TLD and domain characteristics)
    const age = estimateDomainAge(domain);
    
    return {
      domainAuthority: `${da}/100`,
      domainRating: `${dr}/100`,
      backlinksEstimate: backlinks,
      domainAge: age,
      performanceScore: 'See Web Vitals tab',
    };
  } catch (error) {
    console.warn('Domain metrics error:', error);
    return null;
  }
}

// Calculate Domain Authority Score (0-100)
function calculateDomainAuthorityScore(domain, protocol) {
  let score = 40; // Base score
  
  // HTTPS (+15 points)
  if (protocol === 'https:') {
    score += 15;
  }
  
  // TLD quality (+20 points max)
  const tldScores = {
    '.gov': 20, '.edu': 18, '.org': 12, '.com': 10, '.net': 8, 
    '.io': 8, '.co': 6, '.info': 4, '.biz': 3
  };
  
  for (const [tld, points] of Object.entries(tldScores)) {
    if (domain.endsWith(tld)) {
      score += points;
      break;
    }
  }
  
  // Domain length factor (+10 points max)
  // Shorter domains are usually more valuable/established
  const domainParts = domain.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || domain;
  const length = mainDomain.length;
  
  if (length <= 4) score += 10;
  else if (length <= 6) score += 8;
  else if (length <= 8) score += 6;
  else if (length <= 10) score += 4;
  else if (length <= 12) score += 2;
  
  // WWW prefix suggests established site (+5 points)
  if (domain.startsWith('www.')) {
    score += 5;
  }
  
  // Common dictionary words or brands (+10 points)
  const commonWords = ['google', 'amazon', 'facebook', 'apple', 'microsoft', 'github', 'twitter', 'youtube', 'wikipedia', 'reddit'];
  if (commonWords.some(word => domain.includes(word))) {
    score += 10;
  }
  
  return Math.min(Math.round(score), 100);
}

// Calculate Domain Rating Score (0-100) - Similar to Ahrefs DR
function calculateDomainRatingScore(domain, protocol) {
  let score = 35; // Lower base score than DA
  
  // HTTPS (+20 points - more weight for DR)
  if (protocol === 'https:') {
    score += 20;
  }
  
  // TLD quality (+25 points max - more weight)
  const tldScores = {
    '.gov': 25, '.edu': 22, '.org': 15, '.com': 12, '.net': 10,
    '.io': 10, '.co': 8, '.info': 5, '.biz': 4
  };
  
  for (const [tld, points] of Object.entries(tldScores)) {
    if (domain.endsWith(tld)) {
      score += points;
      break;
    }
  }
  
  // Domain characteristics (+15 points max)
  const domainParts = domain.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || domain;
  const length = mainDomain.length;
  
  // Very short domains = likely premium/old
  if (length <= 3) score += 15;
  else if (length <= 5) score += 12;
  else if (length <= 7) score += 9;
  else if (length <= 9) score += 6;
  else if (length <= 12) score += 3;
  
  // No hyphens or numbers suggests quality (+5 points)
  if (!mainDomain.includes('-') && !/\d/.test(mainDomain)) {
    score += 5;
  }
  
  // Known high-authority domains (+15 points)
  const highAuthDomains = ['google', 'amazon', 'facebook', 'apple', 'microsoft', 'github', 'stackoverflow', 'twitter', 'youtube', 'wikipedia', 'reddit', 'medium', 'linkedin'];
  if (highAuthDomains.some(word => domain.includes(word))) {
    score += 15;
  }
  
  return Math.min(Math.round(score), 100);
}

// Estimate backlinks based on DA and DR
function estimateBacklinks(domain, da, dr) {
  // Higher DA/DR suggests more backlinks
  const avgScore = (da + dr) / 2;
  
  if (avgScore >= 80) return '10K+ (estimated)';
  if (avgScore >= 70) return '5K-10K (estimated)';
  if (avgScore >= 60) return '1K-5K (estimated)';
  if (avgScore >= 50) return '500-1K (estimated)';
  if (avgScore >= 40) return '100-500 (estimated)';
  if (avgScore >= 30) return '50-100 (estimated)';
  return '<50 (estimated)';
}

// Estimate domain age
function estimateDomainAge(domain) {
  // This is a very rough estimation based on domain characteristics
  const domainParts = domain.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || domain;
  
  // Shorter domains = likely older
  if (mainDomain.length <= 4) return '10+ years (estimated)';
  if (mainDomain.length <= 6) return '5-10 years (estimated)';
  if (mainDomain.length <= 8) return '3-5 years (estimated)';
  if (mainDomain.length <= 10) return '1-3 years (estimated)';
  return '<1 year (estimated)';
}

// Security Headers API - REMOVED (no longer needed)

// HTTP Archive data - REMOVED (replaced with new metrics)

// Extract security and tech info from the current page
async function extractSecurityFromPage(url) {
  try {
    const urlObj = new URL(url);
    
    return {
      https: urlObj.protocol === 'https:',
    };
  } catch (error) {
    console.warn('Page extraction error:', error);
    return null;
  }
}

// Calculate estimated Domain Authority based on multiple factors
function calculateDomainAuthority(metrics, domain) {
  let score = 50; // Base score
  
  // Security factors (max +30 points)
  if (metrics.httpsEnabled === 'Yes') score += 10;
  if (metrics.hsts === 'Enabled') score += 5;
  if (metrics.contentSecurityPolicy === 'Configured') score += 5;
  if (metrics.xFrameOptions === 'Configured') score += 5;
  
  // Domain factors (max +20 points)
  const tldScore = {
    '.gov': 15, '.edu': 12, '.org': 8, '.com': 5, '.net': 5
  };
  for (const [tld, points] of Object.entries(tldScore)) {
    if (domain.endsWith(tld)) {
      score += points;
      break;
    }
  }
  
  // Domain length (shorter = older/established)
  const domainParts = domain.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || domain;
  if (mainDomain.length <= 6) score += 5;
  else if (mainDomain.length <= 10) score += 3;
  
  // Cap at 100
  score = Math.min(Math.round(score), 100);
  
  return `${score}/100`;
}

// Calculate Domain Rating based on multiple factors (legacy function)
function calculateDomainRating(metrics, domain) {
  let score = 45; // Slightly lower base than DA
  
  // Security factors (max +25 points)
  if (metrics.httpsEnabled === 'Yes') score += 12;
  if (metrics.hsts === 'Enabled') score += 6;
  if (metrics.contentSecurityPolicy === 'Configured') score += 4;
  if (metrics.xFrameOptions === 'Configured') score += 3;
  
  // Domain factors (max +30 points)
  const tldScore = {
    '.gov': 20, '.edu': 16, '.org': 10, '.com': 8, '.net': 6
  };
  for (const [tld, points] of Object.entries(tldScore)) {
    if (domain.endsWith(tld)) {
      score += points;
      break;
    }
  }
  
  // Domain length and quality
  const domainParts = domain.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || domain;
  if (mainDomain.length <= 5) score += 10;
  else if (mainDomain.length <= 8) score += 6;
  else if (mainDomain.length <= 12) score += 3;
  
  // Cap at 100
  score = Math.min(Math.round(score), 100);
  
  return Math.min(Math.round(score), 100);
}

// Calculate Trust Score based on SEO Score, Domain Authority, Domain Rating, and security factors
// This function runs in the context of the page
function extractSEOData() {
  const data = {};

  // Basic meta tags
  data.title = document.title;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  data.description = metaDescription?.content || '';

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  data.keywords = metaKeywords?.content || '';

  const canonical = document.querySelector('link[rel="canonical"]');
  data.canonical = canonical?.href || '';

  const robots = document.querySelector('meta[name="robots"]');
  data.robots = robots?.content || '';

  // Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  data.ogTitle = ogTitle?.content || '';

  const ogDescription = document.querySelector('meta[property="og:description"]');
  data.ogDescription = ogDescription?.content || '';

  const ogImage = document.querySelector('meta[property="og:image"]');
  data.ogImage = ogImage?.content || '';

  const ogType = document.querySelector('meta[property="og:type"]');
  data.ogType = ogType?.content || '';

  // Twitter Card tags
  const twitterCard = document.querySelector('meta[name="twitter:card"]');
  data.twitterCard = twitterCard?.content || '';

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  data.twitterTitle = twitterTitle?.content || '';

  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  data.twitterDescription = twitterDescription?.content || '';

  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  data.twitterImage = twitterImage?.content || '';

  // Viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  data.viewport = viewport?.content || '';

  // Language
  data.language = document.documentElement.lang || document.querySelector('meta[http-equiv="content-language"]')?.content || '';

  // Charset
  const charset = document.querySelector('meta[charset]') || document.querySelector('meta[http-equiv="Content-Type"]');
  data.charset = charset?.getAttribute('charset') || charset?.content?.match(/charset=([^;]+)/)?.[1] || '';

  // Heading counts
  data.h1Count = document.querySelectorAll('h1').length;
  data.h2Count = document.querySelectorAll('h2').length;

  // Images analysis
  const images = document.querySelectorAll('img');
  data.imagesCount = images.length;
  data.imagesWithoutAlt = Array.from(images).filter(img => !img.alt || img.alt.trim() === '').length;

  // Links analysis
  const links = document.querySelectorAll('a[href]');
  const currentDomain = window.location.hostname;
  data.linksInternal = 0;
  data.linksExternal = 0;

  links.forEach(link => {
    try {
      const href = link.getAttribute('href');
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      const linkUrl = new URL(href, window.location.href);
      if (linkUrl.hostname === currentDomain) {
        data.linksInternal++;
      } else {
        data.linksExternal++;
      }
    } catch (e) {
      // Invalid URL
    }
  });

  // Structured data (Schema.org)
  const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
  data.hasSchema = schemaScripts.length > 0;
  
  if (data.hasSchema) {
    const schemaTypes = new Set();
    schemaScripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent);
        const extractTypes = (obj) => {
          if (obj && obj['@type']) {
            if (Array.isArray(obj['@type'])) {
              obj['@type'].forEach(type => schemaTypes.add(type));
            } else {
              schemaTypes.add(obj['@type']);
            }
          }
          if (obj && obj['@graph']) {
            obj['@graph'].forEach(item => extractTypes(item));
          }
        };
        extractTypes(json);
      } catch (e) {
        // Invalid JSON
      }
    });
    data.schemaTypes = Array.from(schemaTypes).join(', ') || 'Unknown';
  } else {
    data.schemaTypes = '';
  }

  // Word Count
  const bodyText = document.body.innerText;
  // Split by whitespace and filter empty strings
  data.wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  // Text to HTML Ratio
  const htmlLength = document.documentElement.outerHTML.length;
  const textLength = bodyText.length;
  data.textToHtmlRatio = htmlLength > 0 ? Math.round((textLength / htmlLength) * 100) : 0;

  // Favicon
  const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
  data.hasFavicon = !!favicon;

  // Deprecated Tags
  data.deprecatedTags = [];
  if (document.querySelector('meta[name="keywords"]')) {
    data.deprecatedTags.push('<meta name="keywords">');
  }
  if (document.querySelector('center')) {
    data.deprecatedTags.push('<center>');
  }
  if (document.querySelector('font')) {
    data.deprecatedTags.push('<font>');
  }

  return data;
}

// Calculate SEO score based on various factors
function calculateSEOScore(data, externalMetrics = {}) {
  let score = 0;
  const maxScore = 100;

  // Title (10 points)
  if (data.title && data.title.length > 0) {
    score += 3;
    if (data.title.length >= 30 && data.title.length <= 60) {
      score += 7;
    } else if (data.title.length > 0) {
      score += 3;
    }
  }

  // Description (10 points)
  if (data.description && data.description.length > 0) {
    score += 3;
    if (data.description.length >= 120 && data.description.length <= 160) {
      score += 7;
    } else if (data.description.length > 0) {
      score += 3;
    }
  }

  // H1 tags (8 points)
  if (data.h1Count === 1) {
    score += 8;
  } else if (data.h1Count > 0) {
    score += 4;
  }

  // Images with alt (8 points)
  if (data.imagesCount > 0) {
    const altRatio = (data.imagesCount - data.imagesWithoutAlt) / data.imagesCount;
    score += Math.round(altRatio * 8);
  } else {
    score += 8; // No images is fine
  }

  // Canonical tag (4 points)
  if (data.canonical) {
    score += 4;
  }

  // Viewport (4 points)
  if (data.viewport) {
    score += 4;
  }

  // Language (4 points)
  if (data.language) {
    score += 4;
  }

  // Charset (4 points)
  if (data.charset) {
    score += 4;
  }

  // Open Graph (8 points)
  let ogScore = 0;
  if (data.ogTitle) ogScore += 2;
  if (data.ogDescription) ogScore += 2;
  if (data.ogImage) ogScore += 2;
  if (data.ogType) ogScore += 2;
  score += ogScore;

  // Structured data (8 points)
  if (data.hasSchema) {
    score += 8;
  }

  // Internal links (4 points)
  if (data.linksInternal > 0) {
    score += 4;
  }

  // Robots tag (4 points) - check if not blocking
  if (!data.robots || !data.robots.includes('noindex')) {
    score += 4;
  }

  // Word Count (4 points)
  if (data.wordCount > 300) {
    score += 4;
  } else if (data.wordCount > 100) {
    score += 2;
  }

  // Favicon (2 points)
  if (data.hasFavicon) {
    score += 2;
  }

  // Deprecated Tags Penalty (-2 points per tag, max -6)
  if (data.deprecatedTags && data.deprecatedTags.length > 0) {
    score -= Math.min(data.deprecatedTags.length * 2, 6);
  }

  // Security & HTTPS (12 points from external metrics)
  if (externalMetrics.httpsEnabled === 'Yes') {
    score += 6;
  }
  if (externalMetrics.hsts === 'Enabled') {
    score += 3;
  }
  if (externalMetrics.contentSecurityPolicy === 'Configured') {
    score += 3;
  }

  // Ensure score is within 0-100
  return Math.max(0, Math.min(Math.round(score), maxScore));
}

// Identify SEO issues
function identifySEOIssues(data, externalMetrics = {}) {
  const issues = [];

  // Title issues
  if (!data.title || data.title.length === 0) {
    issues.push('Missing title tag');
  } else if (data.title.length < 30) {
    issues.push('Title too short (< 30 characters)');
  } else if (data.title.length > 60) {
    issues.push('Title too long (> 60 characters)');
  }

  // Description issues
  if (!data.description || data.description.length === 0) {
    issues.push('Missing meta description');
  } else if (data.description.length < 120) {
    issues.push('Description too short (< 120 characters)');
  } else if (data.description.length > 160) {
    issues.push('Description too long (> 160 characters)');
  }

  // H1 issues
  if (data.h1Count === 0) {
    issues.push('No H1 tag found');
  } else if (data.h1Count > 1) {
    issues.push(`Multiple H1 tags (${data.h1Count})`);
  }

  // Images without alt
  if (data.imagesWithoutAlt > 0) {
    issues.push(`${data.imagesWithoutAlt} images without alt text`);
  }

  // Missing canonical
  if (!data.canonical) {
    issues.push('Missing canonical URL');
  }

  // Missing viewport
  if (!data.viewport) {
    issues.push('Missing viewport meta tag (not mobile-friendly)');
  }

  // Missing language
  if (!data.language) {
    issues.push('Missing language attribute');
  }

  // Missing Open Graph
  if (!data.ogTitle && !data.ogDescription) {
    issues.push('Missing Open Graph tags (poor social sharing)');
  }

  // Missing structured data
  if (!data.hasSchema) {
    issues.push('No structured data found (limits rich snippets)');
  }

  // Robots issues
  if (data.robots && data.robots.includes('noindex')) {
    issues.push('Page is blocked from indexing (noindex)');
  }

  // Word Count Issues
  if (data.wordCount < 300) {
    issues.push(`Low word count (${data.wordCount} words). Aim for 300+.`);
  }

  // Favicon Issue
  if (!data.hasFavicon) {
    issues.push('Missing favicon');
  }

  // Deprecated Tags Issues
  if (data.deprecatedTags && data.deprecatedTags.length > 0) {
    issues.push(`Deprecated tags found: ${data.deprecatedTags.join(', ')}`);
  }

  // Security issues from external metrics
  if (externalMetrics.httpsEnabled === 'No') {
    issues.push('HTTPS not enabled (security risk & SEO penalty)');
  }

  if (externalMetrics.hsts === 'Not configured') {
    issues.push('HSTS not configured (security improvement needed)');
  }

  if (externalMetrics.contentSecurityPolicy === 'Not configured') {
    issues.push('Content Security Policy not configured');
  }

  return issues;
}
