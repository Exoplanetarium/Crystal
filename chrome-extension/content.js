/* global chrome */
const SUPPORTED_RETAILERS = {
  'amazon.com': 'Amazon',
  'walmart.com': 'Walmart',
  'target.com': 'Target',
  'bestbuy.com': 'Best Buy',
  'homedepot.com': 'Home Depot',
  'lowes.com': 'Lowes',
  'costco.com': 'Costco',
  'nike.com': 'Nike',
  'adidas.com': 'Adidas',
  'apple.com': 'Apple',
  'microsoft.com': 'Microsoft',
  'samsung.com': 'Samsung',
  'dell.com': 'Dell',
  'macys.com': 'Macys',
  'nordstrom.com': 'Nordstrom',
  'gap.com': 'Gap',
  'oldnavy.com': 'Old Navy',
  'ikea.com': 'IKEA',
  'wayfair.com': 'Wayfair',
  'etsy.com': 'Etsy',
  'ebay.com': 'eBay',
  'nvidia.com': 'NVIDIA',
  'ford.com': 'Ford',
  'chevrolet.com': 'Chevrolet',
  'toyota.com': 'Toyota',
  'chevron.com': 'Chevron',
  'corporate.exxonmobil.com': 'ExxonMobil',
  'shell.com': 'Shell',

};

let widgetInjected = false;
let currentCompany = null;

// Initialize when page loads
initialize();

function initialize() {
  // Detect if we're on a supported retailer
  const company = getCompanyName();

  if (company && !widgetInjected) {
    currentCompany = company;
    console.log(`[Crystal] Detected company: ${company}`);

    // Wait a bit for page to fully load
    setTimeout(() => {
      injectWidget(company);
    }, 1500);
  }
}

// Detect company from URL
function getCompanyName() {
  const hostname = window.location.hostname.replace('www.', '');

  // Check if hostname matches supported retailers
  for (const [domain, companyName] of Object.entries(SUPPORTED_RETAILERS)) {
    if (hostname.includes(domain)) {
      return companyName;
    }
  }

  // return detectCompanyFromPage();

  return null;
}

// eslint-disable-next-line no-unused-vars
function detectCompanyFromPage() {
  // Try meta tags first
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName) {
    return ogSiteName.getAttribute('content');
  }

  const twitterSite = document.querySelector('meta[name="twitter:site"]');
  if (twitterSite) {
    return twitterSite.getAttribute('content').replace('@', '');
  }

  // Try page title
  const title = document.title;
  const titleMatch = title.match(/^([^-|]+)/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Try logo alt text
  const logo = document.querySelector('img[alt*="logo" i]');
  if (logo) {
    return logo.alt.replace(/logo/i, '').trim();
  }

  return null;
}

// Inject the collapsible widget
function injectWidget(company) {
  if (widgetInjected) {
    return;
  }

  // Create widget container
  const widget = document.createElement('div');
  widget.id = 'crystal-sustainability-widget';
  widget.className = 'crystal-widget minimized'; // Start minimized (just icon circle)

  widget.innerHTML = `
    <div class="crystal-toggle" id="crystal-toggle">
      <img src="${chrome.runtime.getURL(
        'icons/icon_transparent.png',
      )}" alt="Crystal" class="crystal-icon">
      <span class="crystal-label">Sustainability</span>
    </div>
    <div class="crystal-content" id="crystal-content">
      <div class="crystal-loading">
        <div class="crystal-spinner"></div>
        <p>Checking ${company}'s sustainability...</p>
      </div>
    </div>
  `;

  document.body.appendChild(widget);
  widgetInjected = true;

  // Add toggle listener
  const toggle = document.getElementById('crystal-toggle');
  toggle.addEventListener('click', toggleWidget);

  // Fetch rating data
  fetchAndDisplayRating(company);
}

// Toggle between minimized circle and fully expanded report (with bar transition)
function toggleWidget() {
  const widget = document.getElementById('crystal-sustainability-widget');

  if (widget.classList.contains('minimized')) {
    // Expanding: circle → bar (transition) → full content
    widget.classList.remove('minimized');
    widget.classList.add('transitioning');

    // After bar appears, show content
    setTimeout(() => {
      widget.classList.remove('transitioning');
    }, 300); // Match CSS transition duration
  } else {
    // Collapsing: full content → bar (transition) → circle
    widget.classList.add('transitioning');

    // After content hides, show just circle
    setTimeout(() => {
      widget.classList.remove('transitioning');
      widget.classList.add('minimized');
    }, 300); // Match CSS transition duration
  }
}

// Fetch rating and display
async function fetchAndDisplayRating(company) {
  try {
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'getCompanyRating',
      company: company,
    });

    if (response.success) {
      displayRating(response.data);
    } else {
      displayError(
        "We couldn't get their sustainability report at this time. Please try again later.",
      );
    }
  } catch (error) {
    console.error('[Crystal] Error fetching rating:', error);
    displayError(
      "We couldn't get their information at this time. Please try again later.",
    );
  }
}

// Display the rating in the widget
function displayRating(data) {
  const content = document.getElementById('crystal-content');
  const rating = data.rating;
  const rawData = data.rawData;

  // Determine wallpaper based on rating level
  const wallpaper = getWallpaperUrl(rating.level);

  content.innerHTML = `
    <div class="crystal-rating-container" style="background-image: url('${wallpaper}')">
      <div class="crystal-rating-overlay">
        <div class="crystal-rating-header">
          <h3>${data.company}</h3>
          <div class="crystal-rating-badge" style="background-color: ${
            rating.color
          }">
            ${rating.label}
          </div>
        </div>
        
        <div class="crystal-rating-score">
          <div class="crystal-score-circle" style="border-color: ${
            rating.color
          }">
            <span class="crystal-score-number">
              ${
                rating.score > 80
                  ? 'A'
                  : rating.score > 60
                  ? 'B'
                  : rating.score > 40
                  ? 'C'
                  : rating.score > 20
                  ? 'D'
                  : 'F'
              }
            </span>
          </div>
        </div>
        
        <div class="crystal-details">
          <div class="crystal-detail-item">
            <span class="crystal-detail-icon">🌍</span>
            <span class="crystal-detail-label">Scope 3 Emissions</span>
            <span class="crystal-detail-value">${
              rating.breakdown.emissions ? 'Reported' : 'Not Found'
            }</span>
          </div>
          <div class="crystal-detail-item">
            <span class="crystal-detail-icon">🎯</span>
            <span class="crystal-detail-label">Goals in Report</span>
            <span class="crystal-detail-value">${
              rating.breakdown.goalsCount
            }</span>
          </div>
          <div class="crystal-detail-item">
            <span class="crystal-detail-icon">✅</span>
            <span class="crystal-detail-label">Certifications in Report</span>
            <span class="crystal-detail-value">${
              rating.breakdown.certificationsCount
            }</span>
          </div>
        </div>
        
        <button class="crystal-view-full" id="crystal-view-full">
          View Full Summary
        </button>
      </div>
    </div>
  `;

  // Add listener for "View Full Report" button
  document.getElementById('crystal-view-full').addEventListener('click', () => {
    showFullReport(rawData);
  });
}

// Display error message
function displayError(message) {
  const content = document.getElementById('crystal-content');
  content.innerHTML = `
    <div class="crystal-error">
      <span class="crystal-error-icon">⚠️</span>
      <p>${message}</p>
      <button class="crystal-retry" id="crystal-retry">Retry</button>
    </div>
  `;

  document.getElementById('crystal-retry').addEventListener('click', () => {
    content.innerHTML = `
      <div class="crystal-loading">
        <div class="crystal-spinner"></div>
        <p>Loading...</p>
      </div>
    `;
    fetchAndDisplayRating(currentCompany);
  });
}

// Get wallpaper URL based on rating level
function getWallpaperUrl(level) {
  // These will be bundled with the extension
  const wallpapers = {
    high: chrome.runtime.getURL('wallpapers/high-sustainability.jpg'),
    medium: chrome.runtime.getURL('wallpapers/medium-sustainability.jpg'),
    low: chrome.runtime.getURL('wallpapers/low-sustainability.jpg'),
  };

  return wallpapers[level] || wallpapers.medium;
}

// Show full report in expanded view
function showFullReport(data) {
  const content = document.getElementById('crystal-content');

  content.innerHTML = `
    <div class="crystal-full-report">
      <button class="crystal-back-button" id="crystal-back">← Back</button>
      
      <div class="crystal-report-section">
        <h4>Environmental Impact</h4>
        <p class="crystal-report-text">${
          data.environment || 'No data available'
        }</p>
      </div>
      
      <div class="crystal-report-section">
        <h4>Sustainability Goals</h4>
        <p class="crystal-report-text">${data.goals || 'No goals listed'}</p>
      </div>
      
      <div class="crystal-report-section">
        <h4>Certifications</h4>
        <p class="crystal-report-text">${
          data.certifications || 'No certifications listed'
        }</p>
      </div>
      
      <div class="crystal-report-section">
        <h4>Transparency</h4>
        <p class="crystal-report-text">${
          data.transparency || 'No transparency data'
        }</p>
      </div>
    </div>
  `;

  document.getElementById('crystal-back').addEventListener('click', () => {
    // Re-fetch to show summary view
    fetchAndDisplayRating(currentCompany);
  });
}
