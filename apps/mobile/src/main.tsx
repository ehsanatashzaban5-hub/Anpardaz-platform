import './preload'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ─── Global Pull-to-Refresh ───────────────────────────────────────────────────
(function setupPullToRefresh() {
  const THRESHOLD = 70;   // px of actual finger travel to trigger refresh
  const MAX_PULL  = 100;  // px cap on indicator travel

  let startY     = 0;
  let pulling    = false;
  let refreshing = false;

  const indicator = document.createElement("div");
  indicator.id = "anp-ptr-indicator";
  indicator.innerHTML = '<div class="anp-ptr-spinner"></div>';
  document.body.appendChild(indicator);

  function getScrollableTarget(el: EventTarget | null): Element | null {
    let node = el as Element | null;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const overflow = style.overflowY;
      if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function onTouchStart(e: TouchEvent) {
    if (refreshing) return;
    const touch = e.touches[0];
    const target = getScrollableTarget(e.target);
    const scrollTop = target ? target.scrollTop : window.scrollY;
    if (scrollTop <= 0) {
      startY = touch.clientY;
      pulling = true;
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!pulling || refreshing) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 4) {
      // ignore tiny movements
      if (dy <= 0) { pulling = false; indicator.style.transform = "translateY(-60px)"; indicator.style.opacity = "0"; }
      return;
    }
    // Rubber-band: full pull up to THRESHOLD, then logarithmic beyond
    const capped = dy <= THRESHOLD
      ? dy
      : THRESHOLD + Math.log(1 + (dy - THRESHOLD)) * 12;
    const travel = Math.min(capped, MAX_PULL);
    const progress = Math.min(travel / THRESHOLD, 1);

    indicator.style.transform = `translateY(${travel - 60}px)`;
    indicator.style.opacity = String(Math.min(progress * 1.4, 1));

    const spinner = indicator.querySelector(".anp-ptr-spinner") as HTMLElement | null;
    if (spinner) {
      if (dy >= THRESHOLD) {
        indicator.classList.add("anp-ptr-spinning");
        spinner.style.transform = "";
      } else {
        indicator.classList.remove("anp-ptr-spinning");
        spinner.style.transform = `rotate(${Math.round(progress * 320)}deg)`;
      }
    }
  }

  function collapse(instant?: boolean) {
    indicator.style.transition = instant ? "none" : "transform 0.28s ease, opacity 0.25s ease";
    indicator.style.transform = "translateY(-60px)";
    indicator.style.opacity = "0";
    indicator.classList.remove("anp-ptr-spinning");
    setTimeout(() => { indicator.style.transition = ""; }, 300);
  }

  function onTouchEnd(e: TouchEvent) {
    if (!pulling) return;
    const dy = (e.changedTouches[0]?.clientY ?? startY) - startY;
    pulling = false;

    if (dy >= THRESHOLD) {
      refreshing = true;
      indicator.classList.add("anp-ptr-spinning");
      indicator.style.transition = "transform 0.18s ease";
      indicator.style.transform = "translateY(14px)";
      indicator.style.opacity = "1";
      setTimeout(() => {
        // This indicator must correspond to a real refresh, not a cosmetic spinner.
        window.location.reload();
      }, 750);
    } else {
      collapse();
    }
    startY = 0;
  }

  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchmove",  onTouchMove,  { passive: true });
  document.addEventListener("touchend",   onTouchEnd,   { passive: true });
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
