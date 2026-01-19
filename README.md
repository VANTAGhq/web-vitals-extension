# Web Vitals Chrome Extension Enhanced
*A comprehensive Chrome extension to measure Core Web Vitals metrics plus server info, DNS records, SEO analysis, and accessibility checks*

<img src="media/cwv-extension-drilldown.png">

## 🚀 Enhanced Fork by vantag.es

This is an enhanced and actively maintained fork of the original Google Web Vitals Extension with powerful additional features for developers, SEO professionals, and system administrators.

### ✨ New Features

#### 📊 Six-Tab Interface
- **Web Vitals Tab**: Core Web Vitals metrics with real-time monitoring (LCP, CLS, FCP, TTFB)
- **Server Info Tab**: Comprehensive server and hosting information
- **DNS Info Tab**: Complete DNS records analysis
- **SEO Tab**: Advanced SEO analysis with scoring and recommendations
- **Tech Stack Tab**: Automatic detection of technologies, frameworks, and tools
- **A11y Tab**: Accessibility audit with WCAG compliance checks

#### 🎨 Modern UI Improvements
- **Dark/Light Mode Toggle**: Switch between themes with persistent preferences
- **Shadcn-inspired Design**: Clean, modern interface with card-based layouts
- **Minimalist Design**: Removed unnecessary icons and clutter for better focus
- **Responsive Layout**: Optimized spacing and visual hierarchy

#### 🌍 Server Information
Get detailed information about the website's hosting infrastructure:
- **IP Address**: Server's public IPv4 address
- **Geographic Location**: Country, city, region, and coordinates
- **Timezone**: Server's timezone information
- **ISP & Organization**: Internet Service Provider and organization details
- **ASN**: Autonomous System Number
- **Hostname**: Server hostname identification

*Powered by ipwhois.app API*

#### 🔍 DNS Information
Complete DNS records analysis in one place:
- **A Records**: IPv4 address resolution
- **AAAA Records**: IPv6 address resolution
- **CNAME Records**: Canonical name aliases
- **MX Records**: Mail server configuration with priority
- **NS Records**: Authoritative name servers
- **TXT Records**: Text records (SPF, DKIM, DMARC, verifications)
- **SOA Records**: Start of Authority information

*Powered by Google DNS API*

#### 🎯 SEO Analysis
Comprehensive on-page SEO audit:
- **SEO Score**: Overall page SEO quality (0-100)
- **Domain Authority & Rating**: Third-party domain metrics
- **Meta Tags Analysis**: Title, description, keywords, robots
- **Content Analysis**: Word count, heading structure, images
- **Structured Data**: Schema.org detection and types
- **Open Graph & Twitter Cards**: Social media optimization
- **Issues Detection**: Automatic identification of SEO problems
- **Security Metrics**: HTTPS, HSTS, CSP configuration

#### 💻 Tech Stack Detection
Automatic identification of:
- **CMS & Generators**: WordPress, Hugo, Jekyll, Next.js, etc.
- **Server & Backend**: Nginx, Apache, Node.js, PHP, etc.
- **Frameworks & Libraries**: React, Vue, jQuery, Bootstrap, etc.
- **Analytics & Tools**: Google Analytics, Tag Manager, Hotjar, etc.
- **Fonts**: Google Fonts, Adobe Fonts, custom fonts

#### ♿ Accessibility Audit
WCAG compliance checking:
- **A11y Score**: Overall accessibility rating (0-100)
- **WCAG Level Estimation**: A, AA, or AAA compliance level
- **Issues Detection**: Missing alt text, form labels, ARIA attributes
- **Good Practices**: What your page does well
- **Element Statistics**: Images, links, buttons, inputs scanned
- **Category Breakdown**: Images, forms, navigation, semantic HTML

#### 📧 Support
Found a bug or have a suggestion?
- Open an issue: [GitHub Issues](https://github.com/VANTAGhq/web-vitals-extension/issues)
- Contact: dev@vantag.es

### 🎯 Use Cases

**For Web Developers:**
- Monitor Core Web Vitals in real-time
- Verify server location and hosting setup
- Debug DNS configuration issues
- Identify technology stack of any website
- Check accessibility compliance during development

**For SEO Professionals:**
- Analyze page performance metrics
- Comprehensive on-page SEO audit
- Verify server location for local SEO
- Check structured data and social tags
- Monitor competitor technology choices

**For System Administrators:**
- Quick DNS record verification
- Server geolocation confirmation
- ISP and ASN information lookup
- Infrastructure technology auditing
- Security headers verification

---

## Core Web Vitals Measurement

This extension measures Core Web Vitals metrics in a way that matches how they're measured by Chrome and reported to other Google tools (e.g. [Chrome User Experience Report](https://developer.chrome.com/docs/crux), [Page Speed Insights](https://developers.google.com/speed/pagespeed/insights/), [Search Console](https://search.google.com/search-console/about)).

It leverages the [web-vitals](https://github.com/GoogleChrome/web-vitals) library to capture:

**Core Web Vitals:**
* [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp)
* [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls)

**Diagnostic Metrics:**
* [Time to First Byte (TTFB)](https://web.dev/articles/ttfb)
* [First Contentful Paint (FCP)](https://web.dev/articles/fcp)

## Installation

### From Chrome Web Store
* [Chrome Web Store](https://chromewebstore.google.com/detail/web-vitals/illmkcoedmdanbkoihjpipllkaoakccm)


## Usage

### Six-Tab Interface

This enhanced version includes six powerful tabs accessible from the extension popup:

#### 1. Web Vitals Tab (Default)
Monitor Core Web Vitals metrics with real-time updates:
- **LCP (Largest Contentful Paint)**: Main content loading performance
- **CLS (Cumulative Layout Shift)**: Visual stability
- **FCP (First Contentful Paint)**: Time to first content
- **TTFB (Time to First Byte)**: Server response time

Includes field data from Chrome UX Report (CrUX) for comparison with real users.

#### 2. Server Info Tab
View comprehensive server information:
- Geographic location and coordinates
- ISP and hosting provider details
- ASN and organization information
- Server timezone

**Use cases:**
- Verify CDN configuration
- Check server location for SEO
- Audit hosting infrastructure
- Debug geolocation issues

#### 3. DNS Info Tab
Analyze all DNS records for the current domain:
- A/AAAA records for IP resolution
- MX records for email configuration
- NS records for DNS servers
- TXT records for domain verification
- SOA records for zone information

**Use cases:**
- Verify DNS propagation
- Debug email delivery (SPF, DKIM, DMARC)
- Check domain verification records
- Audit DNS configuration

#### 4. SEO Tab
Comprehensive on-page SEO analysis:
- Overall SEO score with visual indicators
- Domain Authority and Domain Rating
- Title and meta description analysis
- Content quality metrics
- Image optimization
- Structured data detection
- Social media tags (Open Graph, Twitter Cards)
- Security configuration

**Use cases:**
- Quick on-page SEO audit
- Identify missing meta tags
- Check structured data implementation
- Verify social media optimization

#### 5. Tech Stack Tab
Automatic technology detection:
- CMS and static site generators
- Server and backend technologies
- JavaScript frameworks and libraries
- Analytics and marketing tools
- Font providers

**Use cases:**
- Research competitor technology stack
- Verify technology implementation
- Identify analytics tools
- Check framework versions

#### 6. A11y Tab
Accessibility compliance audit:
- Overall accessibility score
- WCAG compliance level estimation
- Detailed issues by category
- Good practices recognition
- Element statistics

**Use cases:**
- WCAG compliance checking
- Accessibility issue identification
- Development quality assurance
- Pre-launch accessibility audit

All tabs support lazy loading - data is only fetched when you open the respective tab, ensuring optimal performance.

## API Keys

### CrUX API (Chrome User Experience Report)
The extension uses the CrUX API to fetch field data. To use this feature, you'll need to provision an API key:

1. Visit the [CrUX API docs](https://developer.chrome.com/docs/crux/api#APIKey)
2. Follow the instructions to get your API key
3. Add the key to the extension options
4. It doesn't cost anything to use the API, but rate limiting restrictions will apply

## Updating Dependencies

To stay up to date with the [web-vitals.js library](https://github.com/GoogleChrome/web-vitals), periodically run:

```sh
npm update web-vitals --save
```

## Contributing

If your feedback is related to how we measure metrics, please file an issue against [github discussions](https://github.com/orgs/VANTAGhq/discussions) directly.

### How is the Extension Code Structured?

* `src/browser_action/vitals.js`: Collects metrics using WebVitals.js and broadcasts changes
* `service_worker.js`: Performs badge icon updates and handles background tasks
* `src/browser_action/popup.js`: Handles rendering of the six-tab interface
* `src/browser_action/server-info.js`: Server information API integration
* `src/browser_action/dns-info.js`: DNS records API integration
* `src/browser_action/seo-info.js`: SEO analysis and scoring logic
* `src/browser_action/tech-info.js`: Technology stack detection
* `src/browser_action/a11y-info.js`: Accessibility audit logic
* `src/options/options.js`: Options UI for advanced features

## FAQ

**Who is the primary audience for this extension?**

This enhanced version targets three primary audiences:
1. **Web Developers**: Core Web Vitals monitoring and accessibility checks
2. **SEO Professionals**: Comprehensive on-page SEO analysis and competitor research
3. **System Administrators**: Server and DNS information at a glance

**How should I interpret the metrics numbers reported by this tool?**

This extension reports metrics for your desktop or laptop machine. In many cases this hardware will be significantly faster than that of the median mobile phone your users may have. For this reason, it is strongly recommended that you test using tools like [Lighthouse](https://developers.google.com/web/tools/lighthouse/) and on real mobile hardware (e.g via [WebPageTest](https://webpagetest.org/easy)) to ensure all your users there have a positive experience.

**What actions can I take to improve my Core Web Vitals?**

We recommend these guides for optimizing each of the Core Web Vitals metrics:

* [Optimize CLS](https://web.dev/articles/optimize-cls)
* [Optimize LCP](https://web.dev/articles/optimize-lcp)
* [Optimize TTFB](https://web.dev/articles/optimize-ttfb)

Lighthouse also includes additional actionability audits for these metrics.

**Are the SEO, Tech Stack, and Accessibility features real-time?**

Yes, all analyses are performed in real-time when you open the respective tab. The extension analyzes the current state of the page at that moment.

**What APIs does this extension use?**

- **ipwhois.app**: Server geolocation information
- **Google DNS API**: DNS records lookup
- **Chrome UX Report (CrUX)**: Field performance data (requires API key)

## Version History

**v2.0.0** - Enhanced Fork
- Added 5 new tabs: Server Info, DNS Info, SEO, Tech Stack, A11y
- Implemented dark/light mode toggle
- Removed INP metric (not reliable)
- Modern UI redesign with shadcn principles
- Fixed server and backend detection
- Removed end-of-life notice

**v1.x** - Original Google Extension
- Core Web Vitals monitoring
- Badge and overlay features
- Console logging

## Roadmap

- [ ] Chrome Web Store publication
- [ ] Export reports to PDF
- [ ] Historical metrics tracking
- [ ] Lighthouse score integration
- [ ] Custom SEO rules
- [ ] Accessibility issue auto-fix suggestions

## License

[Apache 2.0](/LICENSE)

---

**Maintained by [vantag.es](https://vantag.es/)** | **Report Issues**: [GitHub](https://github.com/VANTAGhq/web-vitals-extension/issues)
