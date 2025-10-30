/* global chrome, confirm */
/* eslint-disable no-alert */
// Popup script - handles extension popup UI
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();

  document.getElementById('refresh-btn').addEventListener('click', refreshCache);
  document.getElementById('clear-btn').addEventListener('click', clearCache);
});

async function loadStats() {
  try {
    const data = await chrome.storage.local.get(null);

    // Count cached companies
    let count = 0;
    let oldestTimestamp = null;

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('rating_')) {
        count++;
        if (!oldestTimestamp || value.timestamp < oldestTimestamp) {
          oldestTimestamp = value.timestamp;
        }
      }
    }

    document.getElementById('cached-count').textContent = count;

    // Calculate when oldest cache expires
    if (oldestTimestamp) {
      const CACHE_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 days
      const expiryDate = new Date(oldestTimestamp + CACHE_DURATION);
      document.getElementById('cache-expiry').textContent = expiryDate.toLocaleDateString();
    } else {
      document.getElementById('cache-expiry').textContent = 'No cache';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function refreshCache() {
  const btn = document.getElementById('refresh-btn');
  btn.textContent = 'Refreshing...';
  btn.disabled = true;

  // Clear all cached ratings
  try {
    const data = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(data).filter(key => key.startsWith('rating_'));

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }

    btn.textContent = 'Refreshed!';
    setTimeout(() => {
      btn.textContent = 'Refresh Cache';
      btn.disabled = false;
      loadStats();
    }, 1000);
  } catch (error) {
    console.error('Error refreshing cache:', error);
    btn.textContent = 'Error';
    setTimeout(() => {
      btn.textContent = 'Refresh Cache';
      btn.disabled = false;
    }, 1500);
  }
}

async function clearCache() {
  const btn = document.getElementById('clear-btn');
  const confirmed = confirm('Clear all cached sustainability data?');

  if (!confirmed) {return;}

  btn.textContent = 'Clearing...';
  btn.disabled = true;

  try {
    await chrome.storage.local.clear();

    btn.textContent = 'Cleared!';
    setTimeout(() => {
      btn.textContent = 'Clear Data';
      btn.disabled = false;
      loadStats();
    }, 1000);
  } catch (error) {
    console.error('Error clearing cache:', error);
    btn.textContent = 'Error';
    setTimeout(() => {
      btn.textContent = 'Clear Data';
      btn.disabled = false;
    }, 1500);
  }
}
