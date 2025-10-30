# 🚀 QUICK START - Test Your Extension in 5 Minutes!

## Step-by-Step Testing Instructions

### 1️⃣ Add Required Images (2 minutes)

You need to add images before the extension will work properly:

**A. Extension Icons** (in `icons/` folder):
```
- icon16.png (16x16px)
- icon48.png (48x48px) 
- icon128.png (128x128px)
```
→ Use your Crystal_LOGO.jpg and resize it: https://resizeimage.net/

**B. Wallpaper Images** (in `wallpapers/` folder):
```
- high-sustainability.jpg   (green/nature theme)
- medium-sustainability.jpg (yellow/neutral theme)
- low-sustainability.jpg    (red/industrial theme)
```
→ Get free stock photos: https://unsplash.com/s/photos/sustainability
   Or use AI: https://www.bing.com/images/create

**Quick wallpaper suggestions:**
- **High**: Search "green forest sunlight" or "solar panels field"
- **Medium**: Search "urban sustainability" or "city park"
- **Low**: Search "industrial landscape" or "factory emissions"

---

### 2️⃣ Load Extension in Chrome (30 seconds)

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top-right)
4. Click **"Load unpacked"**
5. Select folder: `C:\Users\ToniH\Documents\GitHub\Crystal\chrome-extension`
6. Done! ✅

---

### 3️⃣ Test It! (1 minute)

**Visit a supported site:**
- https://www.amazon.com
- https://www.nike.com
- https://www.apple.com
- https://www.target.com

**What to expect:**
1. A purple **"🌱 Sustainability"** button appears in the top-right corner
2. Click it to expand the widget
3. Widget shows:
   - Loading spinner → "Checking [Company]'s sustainability..."
   - Rating with beautiful wallpaper background
   - Score circle (0-100)
   - Emissions, Goals, Certifications count
   - "View Full Report" button

**If widget doesn't appear:**
- Press F12 → Console tab
- Look for `[Crystal]` logs to debug
- Make sure you're on a supported retailer (see list in README)

---

### 4️⃣ Test the Popup (30 seconds)

1. Click the Crystal extension icon in your toolbar (top-right of Chrome)
2. Popup shows:
   - Number of cached companies
   - Cache expiry date
   - Refresh/Clear buttons

---

## 🐛 Troubleshooting

### "No icon appearing in toolbar"
→ You forgot to add the icon images! Add icon16.png, icon48.png, icon128.png to `icons/` folder

### "Widget not showing on Amazon"
→ Refresh the page after loading extension
→ Check console (F12) for errors
→ Make sure you're on amazon.com, not amazon.co.uk or other TLD

### "Wallpaper not loading"
→ Add the 3 JPG files to `wallpapers/` folder
→ Make sure filenames match exactly: `high-sustainability.jpg` etc.

### "API request failed"
→ Your backend must be running and accessible
→ Check `background.js` line 2 for correct API endpoint

---

## 📸 Expected Behavior

### When you visit Nike.com:
```
1. Widget appears top-right: [🌱 Sustainability ▼]
2. Click to expand
3. See:
   - "Nike" header
   - Green/Yellow/Red badge: "Excellent Sustainability"
   - Score circle: "78/100"
   - Details: Emissions ✓, 12 Goals, 8 Certifications
   - Background: Beautiful green forest wallpaper
4. Click "View Full Report"
5. See full text of goals, emissions data, certifications, transparency
```

---

## 🎯 Next Actions

- [ ] Add 3 icon files to `icons/` folder
- [ ] Add 3 wallpaper images to `wallpapers/` folder  
- [ ] Load extension: `chrome://extensions/` → Load unpacked
- [ ] Test on Amazon, Nike, Apple
- [ ] Check popup by clicking extension icon
- [ ] Try "View Full Report" button
- [ ] Test collapse/expand toggle

---

## 🚢 When Ready to Share

**Option 1: Share with Friends**
1. Zip the entire `chrome-extension` folder
2. Send to friends
3. They load it via "Load unpacked"

**Option 2: Publish to Chrome Web Store**
1. Pay $5 developer fee
2. Upload ZIP at https://chrome.google.com/webstore/devconsole
3. Add screenshots, description
4. Submit for review (1-3 days)

---

**You're ready to GO! 🎉**

Load it up and start shopping sustainably! 🌱
