# Crystal Chrome Extension

Turn your React Native sustainability app into a Chrome extension that shows company ratings while you shop!

## 🚀 Quick Start - Testing Your Extension

### Step 1: Load the Extension (30 seconds)

1. **Open Chrome** and navigate to: `chrome://extensions/`
2. **Enable Developer Mode** - toggle the switch in the top-right corner
3. **Click "Load unpacked"** button
4. **Select the folder**: `C:\Users\ToniH\Documents\GitHub\Crystal\chrome-extension`
5. **Extension loaded!** You should see the Crystal icon in your extensions toolbar

### Step 2: Add Wallpaper Images (Required)

The extension needs 3 wallpaper images for the rating backgrounds. Place these in the `wallpapers/` folder:

- `high-sustainability.jpg` - Green/nature-themed background (for excellent ratings)
- `medium-sustainability.jpg` - Yellow/neutral-themed background (for moderate ratings)
- `low-sustainability.jpg` - Red/warning-themed background (for poor ratings)

**Recommended image specs:**
- Size: 800x600px minimum
- Format: JPG or PNG
- Keep file size under 500KB each for fast loading

**Quick tip**: Use AI image generators or stock photos:
- High: Green forests, clean energy, nature
- Medium: Urban landscapes, mixed sustainability
- Low: Industrial scenes, pollution (tastefully done)

### Step 3: Add Extension Icons (Required)

Create or copy your Crystal app icon to the `icons/` folder in three sizes:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

You can use your existing `Crystal_LOGO.jpg` and resize it, or use an online tool like [ResizeImage.net](https://resizeimage.net/)

### Step 4: Test It Out!

1. **Visit a supported retailer**: Go to any of these sites:
   - Amazon.com
   - Nike.com
   - Apple.com
   - Target.com
   - Walmart.com
   - Best Buy
   - (+ 14 more in the list)

2. **Look for the widget**: A purple "🌱 Sustainability" button should appear in the top-right corner

3. **Click to expand**: Click the button to see the company's sustainability rating with wallpaper background

4. **View full report**: Click "View Full Report" to see detailed goals, emissions, certifications

## 📁 File Structure

```
chrome-extension/
├── manifest.json          ✅ Extension configuration
├── background.js          ✅ API calls, caching, rating calculation
├── content.js            ✅ Company detection, widget injection
├── popup.html            ✅ Extension popup UI
├── popup.js              ✅ Popup functionality
├── widget.css            ✅ Widget styling
├── icons/
│   ├── icon16.png        ⚠️  ADD THIS
│   ├── icon48.png        ⚠️  ADD THIS
│   └── icon128.png       ⚠️  ADD THIS
└── wallpapers/
    ├── high-sustainability.jpg    ⚠️  ADD THIS
    ├── medium-sustainability.jpg  ⚠️  ADD THIS
    └── low-sustainability.jpg     ⚠️  ADD THIS
```

## 🎨 Customization

### Adding More Retailers

Edit `content.js` line 2-23 to add more retailers to the `SUPPORTED_RETAILERS` object:

```javascript
const SUPPORTED_RETAILERS = {
  'yourstore.com': 'Your Store Name',
  // Add as many as you want!
};
```

### Enable Universal Detection (All Sites)

To detect companies on ANY website (not just the top 20):

1. Open `content.js`
2. Go to line 60-62
3. Uncomment this line:
   ```javascript
   return detectCompanyFromPage();
   ```
4. This enables heuristic detection using meta tags, page titles, and logos

### Adjust Cache Duration

Default is 14 days (biweekly). To change:

1. Open `background.js`
2. Edit line 3:
   ```javascript
   const CACHE_DURATION = 14 * 24 * 60 * 60 * 1000; // Change 14 to your preferred days
   ```

Note: Chrome has no hard limit on storage duration, but data can be cleared by the user.

### Customize Rating Algorithm

Edit `background.js` lines 115-188 to adjust how ratings are calculated:

- **Emissions weight**: Currently 40% (lines 137-141)
- **Goals weight**: Currently 30% (lines 145-151)
- **Certifications weight**: Currently 20% (lines 154-156)
- **Transparency weight**: Currently 10% (lines 159-162)

Change score thresholds at lines 166-179 to adjust high/medium/low boundaries.

## 🐛 Debugging

### Widget Not Appearing?

1. **Check console**: Right-click page → Inspect → Console tab
2. **Look for Crystal logs**: Search for `[Crystal]` in console
3. **Verify you're on a supported site**: Check URL matches `SUPPORTED_RETAILERS`
4. **Try refreshing the page**

### API Errors?

1. **Check backend is running**: Your Flask backend must be accessible
2. **Verify API endpoint**: Check `background.js` line 2 points to your backend
3. **Check CORS**: Your backend needs to allow requests from `chrome-extension://`

### Wallpapers Not Loading?

1. **Check file paths**: Must be exactly `wallpapers/high-sustainability.jpg` (etc.)
2. **Check file formats**: JPG or PNG only
3. **Check console for 404 errors**

## 📊 Features Implemented

✅ **Top 20 retailer detection** - Automatically detects major shopping sites  
✅ **Collapsible widget** - Expands/collapses on click  
✅ **Wallpaper ratings** - Three beautiful backgrounds for high/medium/low ratings  
✅ **Biweekly cache** - Stores ratings for 14 days to reduce API calls  
✅ **Full report view** - Drill down into goals, emissions, certifications  
✅ **Error handling** - Graceful fallbacks for API failures  
✅ **Loading states** - Spinner while fetching data  
✅ **Popup dashboard** - See cached companies and manage data  

## 🚢 Publishing to Chrome Web Store (Optional)

When you're ready to publish:

1. **Zip the extension folder** (everything except this README)
2. **Go to**: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. **Pay $5 one-time developer fee**
4. **Upload the ZIP file**
5. **Fill in store listing** (description, screenshots, privacy policy)
6. **Submit for review** (takes 1-3 days)

## 🎯 Next Steps

- [ ] Add wallpaper images to `wallpapers/` folder
- [ ] Add icon images to `icons/` folder
- [ ] Test on Amazon, Nike, Apple, Target
- [ ] Adjust rating algorithm weights if needed
- [ ] Add more retailers to the supported list
- [ ] Optionally enable universal detection for all sites

## 💡 Tips

- **Performance**: The extension caches aggressively to avoid hammering your backend
- **Privacy**: All data is stored locally in the browser, nothing sent to third parties
- **Expandability**: Easy to add more retailers, just add to the object in `content.js`

---

**Built in one day!** 🎉 Now go test it and start shopping sustainably! 🌱
