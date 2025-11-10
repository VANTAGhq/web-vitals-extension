/*
 Copyright 2020 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import { loadLocalMetrics, getOptions, getURL } from './chrome.js';
import { CrUX } from './crux.js';
import { LCP, INP, CLS, FCP, TTFB } from './metric.js';
import { ServerInfo } from './server-info.js';
import { DNSInfo } from './dns-info.js';
import { SEOInfo } from './seo-info.js';

class Popup {

  constructor({metrics, background, options, url, error}) {
    if (error) {
      this.setStatus('Web Vitals are unavailable for this page.\n' + error);
      return;
    }

    const {timestamp, ..._metrics} = metrics;
    // Format as a short timestamp (HH:MM:SS).
    const formattedTimestamp = new Date(timestamp).toLocaleTimeString('en-US', {hourCycle: 'h23'});

    this.timestamp = formattedTimestamp;
    this._metrics = _metrics;
    this.background = background;
    this.options = options;
    this.metrics = {};
    this.url = url;

    this.init();
  }

  init() {
    this.initTabs();
    this.initStatus();
    this.initPage();
    this.initTimestamp();
    this.initMetrics();
    this.initFieldData();
    this.showEOLNotice();
  }

  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');

        // Load server info if server tab is clicked
        if (targetTab === 'server' && !this.serverInfoLoaded) {
          this.loadServerInfo();
        }

        // Load DNS info if DNS tab is clicked
        if (targetTab === 'dns' && !this.dnsInfoLoaded) {
          this.loadDNSInfo();
        }

        // Load SEO info if SEO tab is clicked
        if (targetTab === 'seo' && !this.seoInfoLoaded) {
          this.loadSEOInfo();
        }
      });
    });
  }

  async loadServerInfo() {
    this.serverInfoLoaded = true;
    
    try {
      const startTime = performance.now();
      const serverInfo = await ServerInfo.load(this.url);
      const loadTime = Math.round(performance.now() - startTime);
      
      // Update all server info fields
      document.getElementById('server-ip').innerText = serverInfo.ip;
      document.getElementById('server-hostname').innerText = serverInfo.hostname;
      document.getElementById('server-location').innerText = serverInfo.location;
      document.getElementById('server-country').innerText = `${serverInfo.country} (${serverInfo.countryCode})`;
      document.getElementById('server-city').innerText = serverInfo.city;
      document.getElementById('server-region').innerText = serverInfo.region;
      document.getElementById('server-postal').innerText = serverInfo.postal;
      document.getElementById('server-timezone').innerText = serverInfo.timezone;
      document.getElementById('server-coordinates').innerText = serverInfo.coordinates;
      document.getElementById('server-isp').innerText = serverInfo.isp;
      document.getElementById('server-org').innerText = serverInfo.org;
      document.getElementById('server-asn').innerText = serverInfo.asn;
      
    } catch (e) {
      let errorMessage = e.message || 'Unable to load server information';
      console.error('Server info error:', errorMessage);
      
      // Set all fields to error state
      const errorFields = ['server-ip', 'server-hostname', 'server-location', 'server-country', 
                          'server-city', 'server-region', 'server-postal', 'server-timezone',
                          'server-coordinates', 'server-isp', 'server-org', 'server-asn'];
      errorFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.innerText = 'Error';
          element.style.color = 'var(--color-poor-text)';
        }
      });
    }
  }

  async loadDNSInfo() {
    this.dnsInfoLoaded = true;
    
    try {
      const startTime = performance.now();
      const dnsInfo = await DNSInfo.load(this.url);
      const loadTime = Math.round(performance.now() - startTime);
      
      // Update DNS info fields
      document.getElementById('dns-domain').innerText = dnsInfo.domain;
      document.getElementById('dns-a-record').innerText = dnsInfo.aRecord;
      document.getElementById('dns-aaaa-record').innerText = dnsInfo.aaaaRecord;
      document.getElementById('dns-cname').innerText = dnsInfo.cname;
      document.getElementById('dns-mx').innerText = dnsInfo.mx;
      document.getElementById('dns-ns').innerText = dnsInfo.ns;
      document.getElementById('dns-txt').innerText = dnsInfo.txt;
      document.getElementById('dns-soa').innerText = dnsInfo.soa;
      
    } catch (e) {
      let errorMessage = e.message || 'Unable to load DNS information';
      console.error('DNS info error:', errorMessage);
      
      // Set all fields to error state
      const errorFields = ['dns-domain', 'dns-a-record', 'dns-aaaa-record', 'dns-cname', 
                          'dns-mx', 'dns-ns', 'dns-txt', 'dns-soa'];
      errorFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.innerText = 'Error';
          element.style.color = 'var(--color-poor-text)';
        }
      });
    }
  }

  async loadSEOInfo() {
    this.seoInfoLoaded = true;
    
    try {
      const startTime = performance.now();
      const seoInfo = await SEOInfo.load(this.url);
      const loadTime = Math.round(performance.now() - startTime);
      
      // Extract numeric scores
      const daMatch = seoInfo.domainAuthority.match(/(\d+)/);
      const daScore = daMatch ? parseInt(daMatch[1]) : 0;
      
      const drMatch = seoInfo.domainRating.match(/(\d+)/);
      const drScore = drMatch ? parseInt(drMatch[1]) : 0;
      
      // Update circles in order: DA, DR, SEO
      this.updateCircleScore('domain-authority-circle', 'domain-authority-text', daScore, daScore >= 70 ? 'good' : daScore >= 40 ? 'needs-improvement' : 'poor');
      this.updateCircleScore('domain-rating-circle', 'domain-rating-text', drScore, drScore >= 70 ? 'good' : drScore >= 40 ? 'needs-improvement' : 'poor');
      this.updateSEOScore(seoInfo.seoScore);
      
      // Update SEO Issues
      const issuesContainer = document.getElementById('seo-issues-container');
      if (seoInfo.issues && seoInfo.issues.length > 0) {
        const issuesList = document.getElementById('seo-issues-list');
        issuesList.innerHTML = '';
        seoInfo.issues.forEach(issue => {
          const li = document.createElement('li');
          li.textContent = issue;
          issuesList.appendChild(li);
        });
        issuesContainer.style.display = 'block';
      } else {
        // Hide issues container if no issues found
        issuesContainer.style.display = 'none';
      }
      
      // Update Basic Information
      document.getElementById('seo-title').innerText = seoInfo.title;
      document.getElementById('seo-title-length').innerText = `${seoInfo.titleLength} characters`;
      this.updateLengthIndicator('seo-title-length', seoInfo.titleLength, 30, 60);
      
      document.getElementById('seo-description').innerText = seoInfo.description;
      document.getElementById('seo-description-length').innerText = `${seoInfo.descriptionLength} characters`;
      this.updateLengthIndicator('seo-description-length', seoInfo.descriptionLength, 120, 160);
      
      document.getElementById('seo-keywords').innerText = seoInfo.keywords;
      document.getElementById('seo-canonical').innerText = seoInfo.canonical;
      document.getElementById('seo-robots').innerText = seoInfo.robots;
      document.getElementById('seo-language').innerText = seoInfo.language;
      document.getElementById('seo-viewport').innerText = seoInfo.viewport;
      document.getElementById('seo-charset').innerText = seoInfo.charset;
      
      // Update Security & Trust
      document.getElementById('seo-https').innerText = seoInfo.httpsEnabled;
      this.updateSecurityIndicator('seo-https', seoInfo.httpsEnabled);
      
      document.getElementById('seo-hsts').innerText = seoInfo.hsts;
      this.updateSecurityIndicator('seo-hsts', seoInfo.hsts);
      
      document.getElementById('seo-csp').innerText = seoInfo.contentSecurityPolicy;
      this.updateSecurityIndicator('seo-csp', seoInfo.contentSecurityPolicy);
      
      document.getElementById('seo-xfo').innerText = seoInfo.xFrameOptions;
      this.updateSecurityIndicator('seo-xfo', seoInfo.xFrameOptions);
      
      document.getElementById('seo-backlinks').innerText = seoInfo.backlinksEstimate || 'Unknown';
      document.getElementById('seo-domain-age').innerText = seoInfo.domainAge || 'Unknown';
      
      // Update Content Analysis
      document.getElementById('seo-h1-count').innerText = seoInfo.h1Count;
      this.updateCountIndicator('seo-h1-count', seoInfo.h1Count, 1, 1);
      
      document.getElementById('seo-h2-count').innerText = seoInfo.h2Count;
      document.getElementById('seo-images-count').innerText = seoInfo.imagesCount;
      document.getElementById('seo-images-no-alt').innerText = seoInfo.imagesWithoutAlt;
      
      if (seoInfo.imagesWithoutAlt > 0) {
        document.getElementById('seo-images-no-alt').style.color = 'var(--color-poor-text)';
      }
      
      document.getElementById('seo-links-internal').innerText = seoInfo.linksInternal;
      document.getElementById('seo-links-external').innerText = seoInfo.linksExternal;
      
      // Update Structured Data
      document.getElementById('seo-schema').innerText = seoInfo.hasSchema;
      document.getElementById('seo-schema-types').innerText = seoInfo.schemaTypes;
      
      // Update Open Graph
      document.getElementById('seo-og-title').innerText = seoInfo.ogTitle;
      document.getElementById('seo-og-description').innerText = seoInfo.ogDescription;
      document.getElementById('seo-og-image').innerText = seoInfo.ogImage;
      document.getElementById('seo-og-type').innerText = seoInfo.ogType;
      
      // Update Twitter Card
      document.getElementById('seo-twitter-card').innerText = seoInfo.twitterCard;
      document.getElementById('seo-twitter-title').innerText = seoInfo.twitterTitle;
      document.getElementById('seo-twitter-description').innerText = seoInfo.twitterDescription;
      document.getElementById('seo-twitter-image').innerText = seoInfo.twitterImage;
      
      console.log(`✓ SEO analysis completed in ${loadTime}ms - DA: ${daScore} | DR: ${drScore} | SEO: ${seoInfo.seoScore}`);
    } catch (e) {
      let errorMessage = e.message || 'Unable to analyze SEO';
      console.error('SEO analysis error:', errorMessage);
    }
  }

  updateSEOScore(score) {
    const scoreText = document.getElementById('seo-score-text');
    const scoreCircle = document.getElementById('seo-score-circle');
    
    scoreText.innerText = score;
    
    // Calculate circle progress (circumference = 2 * π * r = 2 * π * 45 ≈ 283)
    const circumference = 2 * Math.PI * 45;
    const progress = (score / 100) * circumference;
    const dashoffset = circumference - progress;
    
    scoreCircle.style.strokeDasharray = circumference;
    scoreCircle.style.strokeDashoffset = dashoffset;
    
    // Color based on score
    if (score >= 80) {
      scoreCircle.style.stroke = 'var(--color-good)';
      scoreText.style.color = 'var(--color-good)';
    } else if (score >= 50) {
      scoreCircle.style.stroke = 'var(--color-needs-improvement)';
      scoreText.style.color = 'var(--color-needs-improvement)';
    } else {
      scoreCircle.style.stroke = 'var(--color-poor)';
      scoreText.style.color = 'var(--color-poor)';
    }
  }

  updateCircleScore(circleId, textId, score, rating) {
    const scoreText = document.getElementById(textId);
    const scoreCircle = document.getElementById(circleId);
    
    scoreText.innerText = score;
    
    // Calculate circle progress
    const circumference = 2 * Math.PI * 45;
    const progress = (score / 100) * circumference;
    const dashoffset = circumference - progress;
    
    scoreCircle.style.strokeDasharray = circumference;
    scoreCircle.style.strokeDashoffset = dashoffset;
    
    // Color based on rating
    const colorMap = {
      'good': 'var(--color-good)',
      'needs-improvement': 'var(--color-needs-improvement)',
      'poor': 'var(--color-poor)'
    };
    
    const color = colorMap[rating] || 'var(--color-text-muted)';
    scoreCircle.style.stroke = color;
    scoreText.style.color = color;
  }

  updateSecurityIndicator(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (value === 'Yes' || value === 'Enabled' || value === 'Configured') {
      element.style.color = 'var(--color-good-text)';
      element.style.fontWeight = '600';
    } else if (value === 'No' || value.includes('Not')) {
      element.style.color = 'var(--color-poor-text)';
      element.style.fontWeight = '600';
    } else {
      element.style.color = 'var(--color-text-muted)';
    }
  }

  updateLengthIndicator(elementId, length, min, max) {
    const element = document.getElementById(elementId);
    if (length === 0) {
      element.style.color = 'var(--color-poor-text)';
    } else if (length >= min && length <= max) {
      element.style.color = 'var(--color-good-text)';
    } else {
      element.style.color = 'var(--color-needs-improvement-text)';
    }
  }

  updateCountIndicator(elementId, count, min, max) {
    const element = document.getElementById(elementId);
    if (count >= min && count <= max) {
      element.style.color = 'var(--color-good-text)';
    } else {
      element.style.color = 'var(--color-needs-improvement-text)';
    }
  }

  initStatus() {
    this.setStatus('Loading field data…');
  }

  initPage() {
    this.setPage(this.url);
  }

  initTimestamp() {
    const timestamp = document.getElementById('timestamp');
    timestamp.innerText = this.timestamp;
  }

  initMetrics() {
    this.metrics.lcp = new LCP({
      local: this._metrics.lcp.value,
      rating: this._metrics.lcp.rating,
      background: this.background
    });
    this.metrics.cls = new CLS({
      local: this._metrics.cls.value,
      rating: this._metrics.cls.rating,
      background: this.background
    });
    this.metrics.inp = new INP({
      local: this._metrics.inp.value,
      rating: this._metrics.inp.rating,
      background: this.background
    });
    this.metrics.fcp = new FCP({
      local: this._metrics.fcp.value,
      rating: this._metrics.fcp.rating,
      background: this.background
    });
    this.metrics.ttfb = new TTFB({
      local: this._metrics.ttfb.value,
      rating: this._metrics.ttfb.rating,
      background: this.background
    });

    this.renderMetrics();
  }

  initFieldData() {
    const formFactor = this.options.preferPhoneField ? CrUX.FormFactor.PHONE : CrUX.FormFactor.DESKTOP;
    CrUX.load(this.url, formFactor).then(fieldData => {
      this.renderFieldData(fieldData, formFactor);
    }).catch(() => {
      this.setStatus('Local metrics only (field data unavailable)');
    });
  }

  showEOLNotice() {
    chrome.storage.sync.get({hideEOLNotice: false}, ({hideEOLNotice}) => {
      if (hideEOLNotice) {
        return;
      }
      const notice = document.getElementById('eol-notice');
      notice.showPopover();
      const hideNoticeToggle = document.getElementById('hide-eol-notice');
      hideNoticeToggle.addEventListener('change', (e) => {
        chrome.storage.sync.set({hideEOLNotice: e.target.checked});
      });
    });
  }

  setStatus(status) {
    const statusElement = document.getElementById('status');

    if (typeof status === 'string') {
      statusElement.innerText = status;
    } else {
      statusElement.replaceChildren(status);
    }
  }

  setPage(url) {
    const page = document.getElementById('page');
    page.innerText = url;
    page.title = url;
  }

  setDevice(formFactor) {
    const deviceElement = document.querySelector('.device-icon');
    deviceElement.classList.add(`device-${formFactor.toLowerCase()}`);
  }

  setHovercardText(metric, fieldData, formFactor='') {
    const hovercard = document.querySelector(`#${metric.id} .hovercard`);
    const abbr = metric.abbr;
    const local = metric.formatValue(metric.local);
    const assessment = metric.rating;
    let text = `Your local <strong>${abbr}</strong> experience is <strong class="hovercard-local">${local}</strong> and rated <strong class="hovercard-local">${assessment}</strong>.`;

    if (fieldData) {
      const assessmentIndex = metric.getAssessmentIndex(metric.rating);
      const density = metric.getDensity(assessmentIndex, 0);
      const scope = CrUX.isOriginFallback(fieldData) ? 'origin' : 'page';
      text += ` <strong>${density}</strong> of <span class="nowrap">real-user</span> ${formFactor.toLowerCase()} <strong>${abbr}</strong> experiences on this ${scope} were also rated <strong class="hovercard-local">${assessment}</strong>.`
    }

    hovercard.innerHTML = text;
  }

  renderMetrics() {
    Object.values(this.metrics).forEach(this.renderMetric.bind(this));
  }

  renderMetric(metric) {
    const template = document.getElementById('metric-template');
    const fragment = template.content.cloneNode(true);
    const metricElement = fragment.querySelector('.metric-wrapper');
    const name = fragment.querySelector('.metric-name');
    const local = fragment.querySelector('.metric-performance-local');
    const localValue = fragment.querySelector('.metric-performance-local-value');
    const infoElement = fragment.querySelector('.info');
    const info = metric.getInfo() || '';
    const rating = metric.rating;

    metricElement.id = metric.id;
    name.innerText = metric.name;
    local.style.marginLeft = metric.getRelativePosition(metric.local);
    localValue.innerText = metric.formatValue(metric.local);
    metricElement.classList.toggle(rating, !!rating);
    infoElement.title = info;
    infoElement.classList.toggle('hidden', info == '');

    // Append to metrics container instead of template parent
    const metricsContainer = document.querySelector('.metrics-container');
    metricsContainer.appendChild(fragment);

    requestAnimationFrame(_ => {
      // Check reversal before and after the transition is settled.
      this.checkReversal(metric);
      this.setHovercardText(metric);
    });
    this.whenSettled(metric).then(_ => this.checkReversal(metric));
  }

  checkReversal(metric) {
    const container = document.querySelector(`#${metric.id} .metric-performance`);
    const local = document.querySelector(`#${metric.id} .metric-performance-local`);
    const localValue = document.querySelector(`#${metric.id} .metric-performance-local-value`);

    const containerBoundingRect = container.getBoundingClientRect();
    const localValueBoundingRect = localValue.getBoundingClientRect();
    const isOverflow = localValueBoundingRect.right > containerBoundingRect.right;

    local.classList.toggle('reversed', isOverflow || local.classList.contains('reversed'));
  }

  renderFieldData(fieldData, formFactor) {
    if (CrUX.isOriginFallback(fieldData)) {
      const fragment = document.createDocumentFragment();
      const span = document.createElement('span');
      span.innerHTML = `Page-level field data is not available<br>Comparing local metrics to <strong>origin-level ${formFactor.toLowerCase()} field data</strong> instead`;
      fragment.appendChild(span);
      this.setStatus(fragment);
      this.setPage(CrUX.getOrigin(fieldData));
    } else {
      this.setStatus(`Local metrics compared to ${formFactor.toLowerCase()} field data`);

      const normalizedUrl = CrUX.getNormalizedUrl(fieldData);
      if (normalizedUrl) {
        this.setPage(normalizedUrl);
      }
    }

    const metrics = CrUX.getMetrics(fieldData).forEach(({id, data}) => {
      const metric = this.metrics[id];
      if (!metric) {
        // The API may return additional metrics that we don't support.
        return;
      }

      metric.distribution = CrUX.getDistribution(data);

      const local = document.querySelector(`#${metric.id} .metric-performance-local`);
      local.style.marginLeft = metric.getRelativePosition(metric.local);

      ['good', 'needs-improvement', 'poor'].forEach((rating, i) => {
        const ratingElement = document.querySelector(`#${metric.id} .metric-performance-distribution-rating.${rating}`);

        ratingElement.innerText = metric.getDensity(i);
        ratingElement.style.setProperty('--rating-width', metric.getDensity(i, 2));
        ratingElement.style.setProperty('--min-rating-width', `${metric.MIN_PCT * 100}%`);
      });

      this.setDevice(formFactor);
      this.setHovercardText(metric, fieldData, formFactor);
      this.whenSettled(metric).then(_ => this.checkReversal(metric));
    });
  }

  whenSettled(metric) {
    const local = document.querySelector(`#${metric.id} .metric-performance-local`);
    return new Promise(resolve => {
      local.addEventListener('transitionend', resolve);
    });
  }

}

Promise.all([loadLocalMetrics(), getOptions(), getURL()]).then(([localMetrics, options, url]) => {
  window.popup = new Popup({...localMetrics, options, url});
});
