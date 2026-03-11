# 🎨 Medical Dashboard - Quick Reference Card

## 🏗️ Layout Structure

```
Results Page
├── Header (Back button, Title, Timestamp, Download button)
├── Dashboard Wrapper (Grid: 70% left, 30% right)
│   ├── LEFT SECTION
│   │   ├── Diagnosis Analysis Header (Stats)
│   │   ├── Symptom Cards Grid (2×2)
│   │   │   ├── Card 1 (animation delay: 0.0s)
│   │   │   ├── Card 2 (animation delay: 0.1s)
│   │   │   ├── Card 3 (animation delay: 0.2s)
│   │   │   └── Card 4 (animation delay: 0.3s)
│   │   ├── Quick Summary Card
│   │   ├── Action Buttons (Download, New Check)
│   │   └── Medical Disclaimer
│   │
│   └── RIGHT SECTION (Sticky)
│       └── Hospital Map Container
│           ├── Header
│           ├── Map Placeholder
│           ├── Hospital List
│           └── Emergency Button
```

---

## 🎨 Color Reference

### Severity Colors
```css
Mild:       #2ecc71 (Green)    ✅
Moderate:   #f39c12 (Orange)   ⚠️
Severe:     #e74c3c (Red)      🚨

Primary:    #1CA7A8 (Teal)
```

### How Colors are Used
```
Card border-left:     Severity color
Progress ring:        Severity color
Badge background:     Severity color (10% opacity)
Precautions box:      Severity color (5% opacity)
```

---

## 🎬 Animation Timeline

### Card Entrance (Per Card)
```
Card 1:     ├─ 0.0s ────────────→ 0.6s [FADE IN + SLIDE UP]
Card 2:                ├─ 0.1s ──→ 0.7s [FADE IN + SLIDE UP]
Card 3:                     ├─ 0.2s → 0.8s [FADE IN + SLIDE UP]
Card 4:                          ├─ 0.3s → 0.9s [FADE IN + SLIDE UP]
```

### Progress Ring
```
Duration: 1.5s
Easing: cubic-bezier(0.34, 1.56, 0.64, 1)
Animation: Stroke-dashoffset from 100% → (100% - confidence%)
```

### Hover Effects
```
Card:              0.3s transform translateY(-4px)
Progress Ring:     1s drop-shadow glow loop
Hospital Item:     0.2s background-color change
```

---

## 📝 Component Props Reference

### ProgressRing
```jsx
Props:
- value (number): 0-100
- size (number): SVG dimensions
- severity (string): 'mild' | 'moderate' | 'severe'

Example:
<ProgressRing value={92} size={100} severity="mild" />
```

### SymptomCard
```jsx
Props:
- condition (object):
  {
    name: string,
    probability: number (0-100),
    severity: string ('mild'|'moderate'|'severe'),
    precautions: array of strings
  }
- index (number): For stagger animation

Example:
<SymptomCard 
  condition={predictions[0]}
  index={0}
/>
```

### HospitalMap
```jsx
Props:
- hospitals (array): Array of hospital objects
  {
    name: string,
    dist: string,
    type: string
  }
- onHospitalClick (function): Click handler

Example:
<HospitalMap 
  hospitals={HOSPITALS}
  onHospitalClick={setSelectedHospital}
/>
```

---

## 🔧 Customization Guide

### Change Grid Columns (Desktop)
**File:** `results-dashboard.css`
```css
.symptom-cards-grid {
  grid-template-columns: repeat(2, 1fr);  /* 2 = 2x2 grid */
  /* Change 2 to: */
  /* 3 = 3-column layout */
  /* 1 = single column */
}
```

### Change Card Spacing
**File:** `results-dashboard.css`
```css
.symptom-cards-grid {
  gap: 20px;  /* Current spacing */
  /* Change to 16px, 24px, 30px, etc. */
}
```

### Change Animation Speed
**File:** `symptom-card.css`
```css
@keyframes cardEnter {
  /* Change duration from 0.6s to preferred speed */
  animation: cardEnter 0.6s ease-out forwards;
}
```

**File:** `progress-ring.css`
```jsx
// Change duration from 1.5s
style={{
  transition: "stroke-dashoffset 1.5s cubic-bezier(...)"
}}
```

### Change Card Hover Lift Distance
**File:** `symptom-card.css`
```css
.symptom-card:hover {
  transform: translateY(-4px);  /* Change -4px to preferred distance */
}
```

### Change Severity Colors
**File:** `symptom-card.css`
```css
.symptom-card.symptom-card-mild {
  --severity-color: #2ecc71;  /* Change this hex code */
  border-left: 4px solid #2ecc71;  /* And this */
}
```

---

## 📱 Responsive Breakpoints

```css
Desktop:  > 1024px   → 2-column layout, 2×2 grid
Tablet:   768-1024px → 2-column layout, 2×2 grid  
Mobile:   < 768px    → 1-column layout, stacked
```

**Key Files for Responsive:**
- `results-dashboard.css` (Main layout changes)
- `symptom-card.css` (Card sizing)
- `hospital-map.css` (Sidebar positioning)

---

## 🐛 Common Issues & Solutions

### Issue: Progress rings not showing percentage
**Solution:** Check if `probability` field exists in data (not `confidence`)

### Issue: Cards not animating in
**Solution:** Verify `index` prop is passed to SymptomCard

### Issue: Colors not applying
**Solution:** Check CSS variable `--severity-color` is correctly set

### Issue: Layout not responsive
**Solution:** Verify media queries in `results-dashboard.css`

### Issue: Hover effect too slow
**Solution:** Reduce transition duration: `.3s` → `.2s`

---

## 📊 Data Format Checklist

Your backend must return:
```javascript
✅ predictions (array)
   ├─ name (string)
   ├─ probability (number, 0-100)  ← Must be 'probability', not 'confidence'
   ├─ severity (string: 'mild'|'moderate'|'severe')
   └─ precautions (array)

✅ confidence (number, 0-100)
✅ overallSeverity (string: 'mild'|'moderate'|'severe')
✅ symptoms (array)
✅ timestamp (ISO string)
```

---

## 🎯 Performance Tips

1. **CSS Animations** use GPU acceleration - Fast! ✅
2. **SVG Progress Rings** are lightweight - Fast! ✅
3. **No external libraries** - Fast! ✅
4. **Responsive grid** adapts automatically - No JavaScript! ✅

---

## 🔗 File Dependencies

```
Results.jsx
├── imports ProgressRing (component)
├── imports SymptomCard (component)
├── imports HospitalMap (component)
└── imports:
    ├── results-dashboard.css
    ├── symptom-card.css
    ├── hospital-map.css
    └── progress-ring.css
```

---

## 📋 CSS Classes Reference

### Main Containers
```css
.results-page              /* Page wrapper */
.results-container         /* Content wrapper */
.dashboard-wrapper         /* 2-column grid */
.symptom-cards-section     /* Left section */
.hospital-section          /* Right section */
```

### Cards
```css
.symptom-card              /* Card container */
.symptom-card-header       /* Card top section */
.symptom-card-progress     /* Progress ring container */
.precautions-list          /* Precautions list */
```

### Hospital
```css
.hospital-map-container    /* Hospital sidebar */
.hospital-list             /* Hospital items container */
.hospital-item             /* Individual hospital item */
```

### Progress Ring
```css
.progress-ring-wrapper     /* SVG container */
.progress-ring-circle      /* SVG circle element */
.progress-ring-text        /* Percentage text */
```

---

## ✨ Feature Checklist

- [x] 2-column layout (70/30 split)
- [x] 2×2 grid for cards
- [x] Animated progress rings
- [x] Staggered card entrance
- [x] Severity color coding
- [x] Hover lift effect
- [x] Hospital finder sidebar
- [x] Responsive design
- [x] Pure CSS animations
- [x] Medical disclaimer
- [x] Summary section
- [x] Download report button

---

## 🎬 Animation Classes

```css
/* Applied automatically via index prop */
.symptom-card {
  animation: cardEnter 0.6s ease-out forwards;
  animation-delay: calc(index * 0.1s);
}
```

---

## 🚀 Deploy Checklist

Before deploying to production:

- [ ] Test on desktop (>1024px)
- [ ] Test on tablet (768-1024px)
- [ ] Test on mobile (<768px)
- [ ] Verify all backend data fields present
- [ ] Check console for errors
- [ ] Verify animations run smoothly (60fps)
- [ ] Test download report functionality
- [ ] Test new check navigation
- [ ] Verify colors display correctly
- [ ] Test on different browsers

---

## 📞 Support

For issues or customizations:
1. Check `IMPLEMENTATION_GUIDE.md` for detailed info
2. Review `symptom-card.css` for styling
3. Review `results-dashboard.css` for layout
4. Check component files for prop options

---

**Last Updated:** 2024  
**Status:** Production Ready ✅  
**Complexity:** Medium (Mostly CSS)  
**Maintenance:** Low (Self-contained)
