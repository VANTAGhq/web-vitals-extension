/*
 Copyright 2025 jmfernxndez. All Rights Reserved.
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

export class DNSInfo {
  constructor(url) {
    this.url = url;
    this.hostname = this.extractHostname(url);
  }

  extractHostname(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return null;
    }
  }

  async fetchWithTimeout(url, options = {}, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  async queryDNS(recordType) {
    try {
      const response = await this.fetchWithTimeout(
        `https://dns.google/resolve?name=${this.hostname}&type=${recordType}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/dns-json'
          }
        }
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.Answer || null;
    } catch (e) {
      return null;
    }
  }

  formatRecords(records, format = 'simple') {
    if (!records || records.length === 0) {
      return 'N/A';
    }

    if (format === 'simple') {
      return records.map(r => r.data).join(', ');
    }

    if (format === 'mx') {
      return records
        .sort((a, b) => {
          const priorityA = parseInt(a.data.split(' ')[0]) || 0;
          const priorityB = parseInt(b.data.split(' ')[0]) || 0;
          return priorityA - priorityB;
        })
        .map(r => r.data)
        .join('\n');
    }

    if (format === 'txt') {
      return records.map(r => r.data.replace(/"/g, '')).join('\n');
    }

    return records.map(r => r.data).join('\n');
  }

  async getDNSInfo() {
    try {
      // Query all DNS record types in parallel
      const [aRecords, aaaaRecords, cnameRecords, mxRecords, nsRecords, txtRecords, soaRecords] = await Promise.all([
        this.queryDNS('A'),
        this.queryDNS('AAAA'),
        this.queryDNS('CNAME'),
        this.queryDNS('MX'),
        this.queryDNS('NS'),
        this.queryDNS('TXT'),
        this.queryDNS('SOA')
      ]);

      return {
        domain: this.hostname,
        aRecord: this.formatRecords(aRecords),
        aaaaRecord: this.formatRecords(aaaaRecords),
        cname: this.formatRecords(cnameRecords),
        mx: this.formatRecords(mxRecords, 'mx'),
        ns: this.formatRecords(nsRecords, 'list'),
        txt: this.formatRecords(txtRecords, 'txt'),
        soa: this.formatRecords(soaRecords)
      };
      
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      if (e.message.includes('Failed to fetch')) {
        throw new Error('Network error');
      }
      
      throw e;
    }
  }

  static async load(url) {
    const dnsInfo = new DNSInfo(url);
    return await dnsInfo.getDNSInfo();
  }
}
