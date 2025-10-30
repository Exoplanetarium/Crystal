/* global chrome */
const API_ENDPOINT =
  'https://ffzv4aia78.execute-api.us-west-2.amazonaws.com/dev/extract-text';
const CACHE_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 days

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCompanyRating') {
    handleGetCompanyRating(request.company)
      .then(sendResponse)
      .catch(error => sendResponse({error: error.message}));
    return true;
  }
});

async function handleGetCompanyRating(companyName) {
  try {
    const cached = await getCachedRating(companyName);
    if (cached) {
      return {success: true, data: cached, fromCache: true};
    }

    const data = await fetchCompanyRating(companyName);

    const rating = calculateRating(data);
    const result = {
      company: companyName,
      rating: rating,
      rawData: data,
      timestamp: Date.now(),
    };

    await cacheRating(companyName, result);
    return {success: true, data: result, fromCache: false};
  } catch (error) {
    return {success: false, error: error.message};
  }
}

async function fetchCompanyRating(companyName) {
  const searchResults = await searchCompanyReport(companyName);

  if (!searchResults || !searchResults.link) {
    throw new Error('No sustainability report found');
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({pdfUrl: searchResults.link}),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

async function searchCompanyReport(companyName) {
  const API_KEY = 'AIzaSyDkr-Bg7qcffPv0RAexhkpfD8GXaoJWuaQ';
  const CX = '0288a889430994f29';
  const currentYear = new Date().getFullYear();
  const searchQuery = encodeURIComponent(
    `${companyName} sustainability report ${currentYear} filetype:pdf`,
  );
  const url = `https://www.googleapis.com/customsearch/v1?q=${searchQuery}&key=${API_KEY}&cx=${CX}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const items = data.items || [];

    const results = items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
    }));

    const foundItem = results.find(item => {
      const link = item.link.toLowerCase();
      const title = item.title.toLowerCase();
      const company = companyName.toLowerCase();

      if (title.includes(company) || link.includes(company)) {
        if (
          link.includes('sustainability') ||
          title.includes('sustainability') ||
          link.includes('impact') ||
          title.includes('impact') ||
          link.includes(currentYear.toString()) ||
          title.includes(currentYear.toString()) ||
          link.includes((currentYear - 1).toString()) ||
          title.includes((currentYear - 1).toString())
        ) {
          return true;
        }
      }
      return false;
    });

    return foundItem || null;
  } catch (error) {
    console.error('[Crystal] Search failed:', error);
    return null;
  }
}

function calculateRating(report) {
  let score = 0;

  const environment = (report.environment || '').toLowerCase();
  let emissionsScore = 0;

  if (environment.includes('scope 3')) {
    emissionsScore += 15;

    if (environment.includes('scope 1')) {
      emissionsScore += 8;
    }
    if (environment.includes('scope 2')) {
      emissionsScore += 7;
    }

    // Points for reduction targets/achievements
    if (environment.includes('reduction') || environment.includes('decrease')) {
      emissionsScore += 5;
    }
    if (
      environment.includes('carbon neutral') ||
      environment.includes('net zero')
    ) {
      emissionsScore += 5;
    }
  } else if (
    environment.includes('scope 1') ||
    environment.includes('scope 2')
  ) {
    emissionsScore += 8; // Partial reporting
  } else if (
    environment.includes('carbon') ||
    environment.includes('emission')
  ) {
    emissionsScore += 3; // Mentions but no detailed reporting
  }

  score += Math.min(emissionsScore, 40);

  // Goals scoring (30% weight - 0-30 points) - Hybrid approach: 60% quality, 40% quantity
  const goals = report.goals || '';
  let goalsScore = 0;
  const goalText = goals.toLowerCase();

  // Quality component (18 points max) - specific, measurable commitments
  if (goalText.includes('net zero')) {
    goalsScore += 10; // Highest ambition
  }
  if (goalText.includes('carbon neutral')) {
    goalsScore += 8;
  }
  if (goalText.match(/\d+%/)) {
    goalsScore += 5; // Quantified targets
  }
  if (goalText.match(/20\d{2}/)) {
    goalsScore += 3; // Timeline dates
  }

  // Scope breadth
  const hasScope1 = goalText.includes('scope 1');
  const hasScope2 = goalText.includes('scope 2');
  const hasScope3 = goalText.includes('scope 3');
  if (hasScope1 && hasScope2 && hasScope3) {
    goalsScore += 8; // Comprehensive emissions coverage
  } else if (hasScope3) {
    goalsScore += 5; // At least scope 3
  }

  // Quantity component (12 points max) - breadth of program
  const goalLines = goals
    .split('\n')
    .filter(line => line.trim().match(/^[-•]\s+/));
  const goalCount = Math.min(goalLines.length, 4); // Cap at 4 to prevent gaming
  goalsScore += goalCount * 3; // Max 12 points

  score += Math.min(goalsScore, 30);

  // Certifications scoring (20% weight - 0-20 points) - Hybrid approach: 70% quality, 30% quantity
  const certifications = report.certifications || '';
  let certScore = 0;
  const certText = certifications.toLowerCase();

  // Quality component (14 points max) - weight by credibility and difficulty
  // Tier 1: Hardest to get (most meaningful)
  if (certText.includes('b corp')) {
    certScore += 8; // Very rigorous third-party validation
  }
  if (certText.includes('iso 14001')) {
    certScore += 6; // International environmental management standard
  }
  if (certText.includes('science based targets')) {
    certScore += 7; // Gold standard for climate commitments
  }

  // Tier 2: Moderate difficulty
  if (certText.includes('leed')) {
    certScore += 4; // Green building certification
  }
  if (certText.includes('energy star')) {
    certScore += 3; // Energy efficiency
  }
  if (certText.includes('fair trade')) {
    certScore += 3; // Social responsibility
  }

  // Tier 3: Basic certifications
  if (certText.includes('organic')) {
    certScore += 2;
  }
  if (certText.includes('forest stewardship')) {
    certScore += 2;
  }

  // Bonus for third-party verification
  if (certText.includes('verified') || certText.includes('audited')) {
    certScore += 2;
  }

  // Quantity component (6 points max) - breadth of certification program
  const certLines = certifications
    .split('\n')
    .filter(line => line.trim().match(/^[-•]\s+/));
  const certCount = Math.min(certLines.length, 3); // Cap at 3 to prevent gaming
  certScore += certCount * 2; // Max 6 points

  score += Math.min(certScore, 20);

  // Transparency scoring (10% weight - 0-10 points)
  const transparency = report.transparency || '';
  let transparencyScore = 0;

  // Length-based scoring with more granularity
  const transparencyLength = transparency.length;
  if (transparencyLength > 500) {
    transparencyScore += 4;
  } else if (transparencyLength > 300) {
    transparencyScore += 3;
  } else if (transparencyLength > 150) {
    transparencyScore += 2;
  } else if (transparencyLength > 50) {
    transparencyScore += 1;
  }

  // Content quality indicators
  const transText = transparency.toLowerCase();
  if (transText.includes('audit') || transText.includes('third party')) {
    transparencyScore += 2;
  }
  if (transText.includes('public') || transText.includes('report')) {
    transparencyScore += 1;
  }
  if (transText.includes('data') || transText.includes('metric')) {
    transparencyScore += 1;
  }
  if (transText.includes('stakeholder')) {
    transparencyScore += 1;
  }
  if (transText.includes('annual')) {
    transparencyScore += 1;
  }

  score += Math.min(transparencyScore, 10);

  // Calculate breakdown values for display (reuse existing variables)
  const hasScope3Display = environment.includes('scope 3');
  const goalCountDisplay = goalLines.length;
  const certCountDisplay = certLines.length;

  // Convert score to rating level
  let level, color, label;
  if (score >= 66) {
    level = 'high';
    color = '#22c55e'; // green
    label = 'Excellent Sustainability';
  } else if (score >= 33) {
    level = 'medium';
    color = '#eab308'; // yellow
    label = 'Moderate Sustainability';
  } else {
    level = 'low';
    color = '#ef4444'; // red
    label = 'Limited Sustainability';
  }

  return {
    score: score,
    level: level,
    color: color,
    label: label,
    breakdown: {
      emissions: hasScope3Display,
      goalsCount: goalCountDisplay,
      certificationsCount: certCountDisplay,
    },
  };
}

// Cache management
async function getCachedRating(companyName) {
  const key = `rating_${companyName.toLowerCase().replace(/\s+/g, '_')}`;
  const result = await chrome.storage.local.get(key);

  if (result[key]) {
    const cached = result[key];
    const age = Date.now() - cached.timestamp;

    // Check if cache is still valid (14 days)
    if (age < CACHE_DURATION) {
      return cached;
    } else {
      // Cache expired, remove it
      await chrome.storage.local.remove(key);
      return null;
    }
  }

  return null;
}

async function cacheRating(companyName, data) {
  const key = `rating_${companyName.toLowerCase().replace(/\s+/g, '_')}`;
  await chrome.storage.local.set({[key]: data});
  console.log(`[Crystal] Cached rating for ${companyName}`);
}

// Clear old cache entries (run periodically)
async function clearExpiredCache() {
  const allData = await chrome.storage.local.get(null);
  const now = Date.now();
  const keysToRemove = [];

  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith('rating_') && value.timestamp) {
      if (now - value.timestamp > CACHE_DURATION) {
        keysToRemove.push(key);
      }
    }
  }

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(
      `[Crystal] Cleared ${keysToRemove.length} expired cache entries`,
    );
  }
}

// Run cache cleanup on extension startup
chrome.runtime.onStartup.addListener(() => {
  clearExpiredCache();
});
