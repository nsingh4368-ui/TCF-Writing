# Mobile View Fixes — Summary

## Files Updated
1. **styles.css** — Mobile-responsive accent dock styling
2. **app-core.js** — Fixed dock visibility logic
3. **app-editor.js** — Focus mode guard + mobile drawer handler

---

## Issues Fixed

### 1. **Accent Dock Covering Content on Mobile** ❌→✅
**Problem:** Fixed positioning on mobile covered the editor and made the app unusable.

**Solution in `styles.css`:**
- Desktop (≥769px): Right-side fixed panel at `right: 20px; bottom: 140px`
- Mobile (≤768px): **Bottom drawer** that slides up from `bottom: -120px` with a **pull handle** (drag bar at the top)
- Added `.accent-dock.open` state to toggle drawer visibility
- Added visual pull handle with `::before` pseudo-element for user affordance

**How it works on mobile:**
- Dock stays collapsed at bottom (not covering content)
- Users tap the drag handle or swipe up to open
- Click handle again or drag down to close
- Dock automatically opens when entering focus/exam mode

---

### 2. **Cannot Exit Focus Mode in Mobile** ❌→✅
**Problem:** Accent dock was hidden or inaccessible during focus mode, so users couldn't access the "Exit" button.

**Solution in `app-core.js`:**
```javascript
// OLD: Dock visibility was view-dependent
const dock=document.querySelector('.accent-dock');
if(dock&&!document.body.classList.contains('exam-active')){
  dock.style.display=(v==='studio'||v==='browse'||...)?'flex':'none';
}

// NEW: Always show dock when focus/exam active, regardless of view
const dock=document.querySelector('.accent-dock');
if(dock){
  const examActive=document.body.classList.contains('exam-active');
  dock.style.display=(focusMode||examActive)?'flex':'none';
}
```

**Result:** Accent dock is now **always accessible** when focus or exam mode is active, on any view.

---

### 3. **Can Start Focus Mode When Not in Editor** ❌→✅
**Problem:** Users could start focus mode from other views (Browse, Vocab, etc.), but the editor wasn't visible.

**Solution in `app-editor.js`:**
```javascript
// OLD: No view check
function toggleFocusMode(){
  if(!combos.length){loadSujets();...}
  setFocus(!focusMode);
  if(focusMode)editor.focus();
}

// NEW: Ensures studio view is active before entering focus mode
function toggleFocusMode(){
  if(!focusMode){
    if(!combos.length){loadSujets();if(!combos.length){...return;}}
    const studioView=document.getElementById('view-studio');
    if(!studioView||studioView.style.display==='none'){
      showView('studio');
      setTimeout(()=>setFocus(true),300);  // Switch to studio first, then activate focus
      return;
    }
    setFocus(true);
    editor.focus();
  }else{
    setFocus(false);  // Exit focus mode
  }
}
```

**Result:** Focus mode only activates when studio view is active, preventing confusion.

---

### 4. **Mobile Drawer Interaction** ✨NEW
**Solution in `app-editor.js`:**
Added full touch-handling for the mobile accent dock drawer:
- **Drag to open/close:** Users can swipe up/down on the dock handle
- **Tap to toggle:** Click the handle to toggle open/closed
- **Snap behavior:** Auto-snaps to open/closed position based on drag distance
- **Auto-open on focus mode:** Dock automatically opens when entering focus/exam mode on mobile
- **Smooth transitions:** CSS transitions for polished feel

---

## Technical Details

### CSS Changes (`styles.css`)
```css
/* Desktop: Side panel */
@media(min-width:769px){
  .accent-dock{right:20px;bottom:140px;width:280px;...}
}

/* Mobile: Bottom drawer */
@media(max-width:768px){
  .accent-dock{
    left:0;right:0;bottom:-120px;  /* Off-screen by default */
    width:100%;border-radius:18px 18px 0 0;
    transition:bottom .25s ease;
  }
  .accent-dock.open{bottom:0;}  /* Slide up when open */
  .accent-dock::before{  /* Visual pull handle */
    content:'';top:8px;width:32px;height:4px;
    background:var(--border);border-radius:99px;cursor:grab;
  }
}

/* Always show when focus/exam active */
@media(max-width:768px){
  body.focus-mode .accent-dock,
  body.exam-active .accent-dock{display:flex!important;}
  .focus-mode .accent-dock{bottom:0!important;}  /* Auto-open */
  .exam-active .accent-dock{bottom:0!important;}
}
```

### JavaScript Changes (`app-editor.js`)

**updateAccentDockVisibility():**
```javascript
// Now also toggles .open class and auto-opens on mobile for focus/exam
function updateAccentDockVisibility(){
  const dock=document.querySelector('.accent-dock');
  if(!dock)return;
  const examActive=document.body.classList.contains('exam-active');
  dock.style.display=(focusMode||examActive)?'flex':'none';
  
  if(focusMode||examActive){
    const isMobile=window.innerWidth<=768;
    if(isMobile)dock.classList.add('open');
  }
}
```

**Touch/Click Handler:**
```javascript
// Allows users to drag the drawer up/down and click to toggle
document.addEventListener('DOMContentLoaded',()=>{
  const dock=document.querySelector('.accent-dock');
  if(!dock)return;
  
  // Touch drag for swipe interaction
  dock.addEventListener('touchstart',(e)=>{
    // Track drag movement and snap drawer to open/closed
    ...
  });
  
  // Click to toggle
  dock.addEventListener('click',()=>{
    if(window.innerWidth<=768){
      dock.classList.toggle('open');
      dock.style.bottom=dock.classList.contains('open')?'0':'-120px';
    }
  });
});
```

---

## Testing Checklist

✅ Desktop (≥769px):
- [ ] Accent dock appears as right-side panel
- [ ] Dock visible in studio, browse, vocab, errors, connectors views
- [ ] Dock hidden in other views (productions, favorites, etc.)
- [ ] Dock always visible when focus mode active
- [ ] Accents insertable into editor

✅ Mobile (≤768px):
- [ ] Accent dock collapsed at bottom (not covering content)
- [ ] Drag handle visible at top of dock
- [ ] Can swipe up on handle to open drawer
- [ ] Can swipe/drag down to close drawer
- [ ] Can click handle to toggle open/closed
- [ ] Dock auto-opens when entering focus mode
- [ ] Dock auto-opens when entering exam mode
- [ ] Can close focus mode via top right "Quitter" button (now accessible)
- [ ] No content covered by dock when collapsed

✅ Focus Mode:
- [ ] Can only enter focus mode from studio view
- [ ] Button switches you to studio if not there
- [ ] Dock visible and accessible (desktop & mobile)
- [ ] Timer and word counter visible
- [ ] Can exit focus mode (mobile: drawer is accessible)

✅ Exam Mode:
- [ ] Dock visible and auto-opened on mobile
- [ ] Accents accessible throughout exam
- [ ] Can insert accents while typing

---

## Migration Notes
Replace these three files in your project:
1. `styles.css` — Complete rewrite of accent dock styles
2. `app-core.js` — Updated `showView()` function
3. `app-editor.js` — Updated `toggleFocusMode()`, `updateAccentDockVisibility()`, and added drawer handler

No HTML changes needed.
