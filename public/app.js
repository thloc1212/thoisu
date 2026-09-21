/**
 * @file app.js
 * Điểm Tin Tuần Thứ 3 - Tháng 9/2026 (14/09/2026 — 20/09/2026)
 * Interactive Editorial Presentation Engine
 * Pure Vanilla JavaScript - Fully Static, Accessible & Responsive
 */

(function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    csvUrl: './data/news.csv',
    fallbackCsvUrl: 'data/news.csv',
    imagesDir: './assets/images/',
    placeholdersDir: './assets/placeholders/',
    totalSlidesEstimate: 9
  };

  // --- State ---
  let newsItems = [];
  let currentActiveIndex = 0; // 0 = Cover, 1..N = News, N+1 = End
  let slideElements = [];
  let lastFocusedTrigger = null;

  // --- DOM Elements Cache ---
  const elProgress = document.getElementById('reading-progress');
  const elDeckContainer = document.getElementById('deck-container');
  const elCounterBadge = document.getElementById('slide-counter-badge');
  const elFloatingNav = document.getElementById('floating-deck-nav');
  const elHeader = document.querySelector('.deck-header');

  // Detail Modal Elements
  const elDetailOverlay = document.getElementById('detail-overlay');
  const elDetailClose = document.getElementById('detail-close');
  const elDetailTag = document.getElementById('detail-tag');
  const elDetailTitle = document.getElementById('detail-title');
  const elDetailText = document.getElementById('detail-text');
  const elDetailSource = document.getElementById('detail-source');

  // Table of Contents Elements
  const elTocOverlay = document.getElementById('toc-overlay');
  const elTocClose = document.getElementById('toc-close');
  const elTocList = document.getElementById('toc-list');
  const elBtnToc = document.getElementById('btn-open-toc');

  // Deck Control Buttons
  const elBtnPrev = document.getElementById('btn-deck-prev');
  const elBtnNext = document.getElementById('btn-deck-next');

  /**
   * Safe URL Validator (strictly http: or https:)
   */
  function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed);
  }

  /**
   * Robust CSV Parser supporting RFC 4180:
   * - UTF-8 BOM removal
   * - Quoted fields with escaped quotes ("")
   * - Embedded commas and newlines
   */
  function parseCSV(text) {
    if (!text) return [];
    
    // Remove UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (insideQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote
            currentCell += '"';
            i += 2;
            continue;
          } else {
            // Closing quote
            insideQuotes = false;
            i++;
            continue;
          }
        } else {
          currentCell += char;
          i++;
          continue;
        }
      } else {
        if (char === '"') {
          insideQuotes = true;
          i++;
          continue;
        } else if (char === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
          i++;
          continue;
        } else if (char === '\r') {
          // Skip carriage return, handle newline next
          i++;
          continue;
        } else if (char === '\n') {
          currentRow.push(currentCell.trim());
          if (currentRow.some(c => c.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
          i++;
          continue;
        } else {
          currentCell += char;
          i++;
        }
      }
    }

    // Push trailing cell/row if remaining
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) return [];

    // Header validation
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const sttIdx = headers.findIndex(h => h === 'stt');
    const titleIdx = headers.findIndex(h => h.includes('tiêu đề') || h.includes('tieu de'));
    const mainIdx = headers.findIndex(h => h.includes('chính') || h.includes('chinh'));
    const detailIdx = headers.findIndex(h => h.includes('chi tiết') || h.includes('chi tiet'));
    const linkIdx = headers.findIndex(h => h.includes('link'));

    const parsedData = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 3) continue;

      const rawStt = row[sttIdx] || String(r);
      const sttNum = parseInt(rawStt, 10) || r;
      const title = row[titleIdx] || '';
      const summary = row[mainIdx] || '';
      const detail = row[detailIdx] || summary;
      const link = row[linkIdx] || '';

      if (title.length > 0) {
        parsedData.push({
          stt: sttNum,
          paddedStt: String(sttNum).padStart(2, '0'),
          title: title,
          summary: summary,
          detail: detail,
          link: isSafeUrl(link) ? link.trim() : ''
        });
      }
    }

    return parsedData;
  }

  // Mapping of real news images in data/ (supports both png and jpg)
  const REAL_NEWS_IMAGES = {
    1: 'data/1.png',
    2: 'data/2.png',
    3: 'data/3.png',
    4: 'data/4.jpg',
    5: 'data/5.jpg',
    6: 'data/6.jpg',
    7: 'data/7.png',
    8: 'data/8.jpg',
    9: 'data/9.jpg'
  };

  /**
   * Helper to resolve news image source with graceful multi-tier fallbacks:
   * 1. Real image in data/ (data/X.png, data/X.jpg, etc.)
   * 2. assets/images/news-0X.png / .jpg / .webp
   * 3. assets/placeholders/news-placeholder.svg
   */
  function setupImageWithFallback(imgElement, paddedStt, stt) {
    const rawStt = Number(stt) || parseInt(paddedStt, 10);
    const knownSrc = REAL_NEWS_IMAGES[rawStt];

    const candidates = [];
    if (knownSrc) {
      candidates.push(knownSrc);
    }
    candidates.push(`data/${rawStt}.png`);
    candidates.push(`data/${rawStt}.jpg`);
    candidates.push(`data/${rawStt}.jpeg`);
    candidates.push(`data/${rawStt}.webp`);
    candidates.push(`${CONFIG.imagesDir}news-${paddedStt}.png`);
    candidates.push(`${CONFIG.imagesDir}news-${paddedStt}.jpg`);
    candidates.push(`${CONFIG.imagesDir}news-${paddedStt}.webp`);
    candidates.push(`${CONFIG.placeholdersDir}news-placeholder.svg`);

    // Deduplicate candidates preserving priority
    const uniqueCandidates = Array.from(new Set(candidates));

    let candidateIndex = 0;
    imgElement.src = uniqueCandidates[0];

    imgElement.onerror = function () {
      candidateIndex++;
      if (candidateIndex < uniqueCandidates.length) {
        imgElement.src = uniqueCandidates[candidateIndex];
      } else {
        imgElement.onerror = null;
      }
    };
  }

  /**
   * Build the Table of Contents List
   */
  function renderTOC() {
    if (!elTocList) return;
    elTocList.innerHTML = '';

    // Cover link
    const coverLi = document.createElement('li');
    coverLi.className = 'toc-item';
    const coverA = document.createElement('a');
    coverA.className = 'toc-link';
    coverA.href = '#slide-cover';
    coverA.innerHTML = '<span class="toc-item-num">00</span><span class="toc-item-title">Mở đầu: Điểm Tin Tuần 3 - Tháng 9/2026</span>';
    coverA.addEventListener('click', (e) => {
      e.preventDefault();
      closeTOC();
      scrollToSlide('slide-cover');
    });
    coverLi.appendChild(coverA);
    elTocList.appendChild(coverLi);

    // News links
    newsItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'toc-item';

      const a = document.createElement('a');
      a.className = 'toc-link';
      a.href = `#slide-${item.paddedStt}`;

      const numSpan = document.createElement('span');
      numSpan.className = 'toc-item-num';
      numSpan.textContent = item.paddedStt;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'toc-item-title';
      titleSpan.textContent = item.title;

      a.appendChild(numSpan);
      a.appendChild(titleSpan);

      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeTOC();
        scrollToSlide(`slide-${item.paddedStt}`);
      });

      li.appendChild(a);
      elTocList.appendChild(li);
    });

    // Closing link
    const closingLi = document.createElement('li');
    closingLi.className = 'toc-item';
    const closingA = document.createElement('a');
    closingA.className = 'toc-link';
    closingA.href = '#slide-closing';
    closingA.innerHTML = '<span class="toc-item-num">10</span><span class="toc-item-title">Tổng kết &amp; Trở về đầu trang</span>';
    closingA.addEventListener('click', (e) => {
      e.preventDefault();
      closeTOC();
      scrollToSlide('slide-closing');
    });
    closingLi.appendChild(closingA);
    elTocList.appendChild(closingLi);
  }

  /**
   * Build Floating Navigation Dots
   */
  function renderFloatingNav() {
    if (!elFloatingNav) return;
    elFloatingNav.innerHTML = '';

    slideElements.forEach((slide, idx) => {
      const dot = document.createElement('button');
      dot.className = 'nav-dot';
      dot.setAttribute('aria-label', `Nhảy đến slide: ${slide.dataset.slideLabel || idx}`);
      if (idx === 0) dot.classList.add('active');

      const tooltip = document.createElement('span');
      tooltip.className = 'nav-dot-tooltip';
      tooltip.textContent = slide.dataset.slideLabel || `Slide ${idx}`;
      dot.appendChild(tooltip);

      dot.addEventListener('click', () => {
        slide.scrollIntoView({ behavior: 'smooth' });
      });

      elFloatingNav.appendChild(dot);
    });
  }

  /**
   * Render an individual News Slide based on its STT and editorial theme
   */
  function createNewsSlide(item) {
    const section = document.createElement('section');
    section.className = 'editorial-slide';
    section.id = `slide-${item.paddedStt}`;
    section.dataset.slideIndex = String(item.stt);
    section.dataset.slideLabel = `${item.paddedStt}. ${item.title.slice(0, 30)}...`;

    // Apply specific art-direction themes based on story archetype
    if (item.stt === 2) {
      section.classList.add('theme-dark');
    }

    const wrap = document.createElement('div');
    wrap.className = 'slide-content-wrap';

    // 1. Meta Line (Tag & Rule)
    const metaLine = document.createElement('div');
    metaLine.className = 'editorial-meta-line';

    const tag = document.createElement('span');
    tag.className = 'editorial-tag';
    tag.textContent = getTagForStory(item.stt);

    const rule = document.createElement('span');
    rule.className = 'editorial-rule';

    metaLine.appendChild(tag);
    metaLine.appendChild(rule);
    wrap.appendChild(metaLine);

    // 2. Composition Layout
    const layout = document.createElement('div');
    layout.className = 'layout-asymmetric';

    // Left Column: Text & Editorial Typography
    const colText = document.createElement('div');
    colText.className = 'col-text';

    const numSpan = document.createElement('div');
    numSpan.className = 'oversized-numeral';
    numSpan.textContent = item.paddedStt;

    const headline = document.createElement('h2');
    headline.className = 'editorial-headline';
    headline.textContent = item.title;

    // Optional Archetype Content Extensions
    let archetypeContent = null;
    if (item.stt === 2) {
      // ADN Liệt sĩ Milestone Blocks
      archetypeContent = document.createElement('div');
      archetypeContent.className = 'stat-callout-grid';
      archetypeContent.innerHTML = `
        <div class="stat-box">
          <div class="stat-number">18.000</div>
          <div class="stat-label">Mẫu hài cốt liệt sĩ</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">500</div>
          <div class="stat-label">Ngày đêm chiến dịch</div>
        </div>
      `;
    } else if (item.stt === 3) {
      // 9 Thành phố Trung ương Chips
      archetypeContent = document.createElement('div');
      archetypeContent.className = 'cities-editorial-grid';
      const cities = [
        'Hà Nội', 'TP.HCM', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế', 'Đồng Nai', 'Quảng Ninh', 'Bắc Ninh'
      ];
      cities.forEach(c => {
        const chip = document.createElement('div');
        chip.className = `city-chip ${c === 'Bắc Ninh' ? 'new-city' : ''}`;
        chip.textContent = c;
        archetypeContent.appendChild(chip);
      });
    } else if (item.stt === 4) {
      // Giáo dục & Đào tạo: Sách giáo khoa
      archetypeContent = document.createElement('div');
      archetypeContent.className = 'stat-callout-grid';
      archetypeContent.innerHTML = `
        <div class="stat-box">
          <div class="stat-number">99,75%</div>
          <div class="stat-label">SGK đã giao đến người học</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">2026–2027</div>
          <div class="stat-label">Rà soát, chỉnh sửa đồng bộ</div>
        </div>
      `;
    } else if (item.stt === 5) {
      // Ngoại giao cấp cao: LHQ & Canada
      archetypeContent = document.createElement('div');
      archetypeContent.className = 'tech-pill-list';
      archetypeContent.innerHTML = `
        <span class="tech-pill">Đại hội đồng LHQ khóa 81</span>
        <span class="tech-pill">Song phương Hoa Kỳ</span>
        <span class="tech-pill">Thăm cấp Nhà nước Canada</span>
        <span class="tech-pill">20–25/09/2026</span>
      `;
    } else if (item.stt === 8) {
      // Diplomatic quote frame (Ukraine)
      archetypeContent = document.createElement('div');
      archetypeContent.className = 'editorial-quote-frame';
      const quoteP = document.createElement('p');
      quoteP.textContent = '“Giảm leo thang quanh hạ tầng trọng yếu có thể là bước đầu hướng tới hòa bình.”';
      archetypeContent.appendChild(quoteP);
    }

    const summaryP = document.createElement('p');
    summaryP.className = 'editorial-summary-body';
    summaryP.textContent = item.summary;

    // Action Row: "Xem chi tiết" & "Đọc bài gốc"
    const actionRow = document.createElement('div');
    actionRow.className = 'slide-action-row';

    const btnDetail = document.createElement('button');
    btnDetail.className = 'btn-secondary';
    btnDetail.type = 'button';
    btnDetail.id = `btn-detail-${item.paddedStt}`;
    btnDetail.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span>Xem chi tiết</span>
    `;
    btnDetail.addEventListener('click', () => {
      openDetail(item, btnDetail);
    });

    actionRow.appendChild(btnDetail);

    if (item.link) {
      const aSource = document.createElement('a');
      aSource.className = 'link-source-inline';
      aSource.href = item.link;
      aSource.target = '_blank';
      aSource.rel = 'noopener noreferrer';
      aSource.innerHTML = `<span>Đọc bài gốc</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"></path></svg>`;
      actionRow.appendChild(aSource);
    }

    colText.appendChild(numSpan);
    colText.appendChild(headline);
    if (archetypeContent) colText.appendChild(archetypeContent);
    colText.appendChild(summaryP);
    colText.appendChild(actionRow);

    // Right Column: Image Frame
    const colVisual = document.createElement('div');
    colVisual.className = 'col-visual';

    const imgFrame = document.createElement('div');
    imgFrame.className = 'image-frame';

    const img = document.createElement('img');
    img.alt = `Hình ảnh minh họa cho: ${item.title}`;
    img.loading = 'lazy';
    setupImageWithFallback(img, item.paddedStt, item.stt);

    imgFrame.appendChild(img);
    colVisual.appendChild(imgFrame);

    layout.appendChild(colText);
    layout.appendChild(colVisual);

    wrap.appendChild(layout);
    section.appendChild(wrap);

    return section;
  }

  /**
   * Editorial Tags by STT
   */
  function getTagForStory(stt) {
    switch (stt) {
      case 1: return 'Chính sách & Phát triển';
      case 2: return 'Tri ân & Công nghệ';
      case 3: return 'Quy hoạch đô thị';
      case 4: return 'Giáo dục & Đào tạo';
      case 5: return 'Ngoại giao cấp cao';
      case 6: return 'Hạ tầng viễn thông';
      case 7: return 'Thể thao châu lục';
      case 8: return 'Thời sự quốc tế';
      case 9: return 'Không gian vũ trụ';
      default: return 'Tin thời sự';
    }
  }

  /**
   * Detail Modal Handlers
   */
  function openDetail(item, triggerBtn) {
    lastFocusedTrigger = triggerBtn;
    if (elDetailTag) elDetailTag.textContent = `TIN SỐ ${item.paddedStt} • ${getTagForStory(item.stt)}`;
    if (elDetailTitle) elDetailTitle.textContent = item.title;
    if (elDetailText) elDetailText.textContent = item.detail || item.summary;

    if (elDetailSource) {
      if (item.link) {
        elDetailSource.href = item.link;
        elDetailSource.style.display = 'inline-flex';
      } else {
        elDetailSource.style.display = 'none';
      }
    }

    if (elDetailOverlay) {
      elDetailOverlay.classList.add('active');
      elDetailOverlay.setAttribute('aria-hidden', 'false');
      if (elDetailClose) elDetailClose.focus();
    }

    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    if (elDetailOverlay) {
      elDetailOverlay.classList.remove('active');
      elDetailOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  /**
   * Table of Contents Modal Handlers
   */
  function openTOC() {
    if (elTocOverlay) {
      elTocOverlay.classList.add('active');
      elTocOverlay.setAttribute('aria-hidden', 'false');
      if (elTocClose) elTocClose.focus();
    }
    document.body.style.overflow = 'hidden';
  }

  function closeTOC() {
    if (elTocOverlay) {
      elTocOverlay.classList.remove('active');
      elTocOverlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (elBtnToc) elBtnToc.focus();
  }

  /**
   * Slide Navigation
   */
  function scrollToSlide(slideId) {
    const target = document.getElementById(slideId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function navigateSlide(direction) {
    // direction: +1 (next), -1 (prev)
    const targetIndex = Math.min(Math.max(0, currentActiveIndex + direction), slideElements.length - 1);
    if (slideElements[targetIndex]) {
      slideElements[targetIndex].scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Scroll & Intersection Observer Engine
   */
  function setupScrollAndObservers() {
    // 1. Reading Progress Bar
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      if (elProgress) {
        elProgress.style.width = `${progress}%`;
      }
    }, { passive: true });

    // 2. Intersection Observer for Active Slide Tracking
    const observerOptions = {
      root: null,
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const slide = entry.target;
          const idx = slideElements.indexOf(slide);
          if (idx !== -1) {
            currentActiveIndex = idx;
            updateSlideUI(idx, slide);
          }
        }
      });
    }, observerOptions);

    slideElements.forEach(s => observer.observe(s));
  }

  /**
   * Update active slide badge, floating dots, and header contrast
   */
  function updateSlideUI(idx, slide) {
    // 1. Counter Badge
    if (elCounterBadge) {
      if (idx === 0) {
        elCounterBadge.textContent = 'MỞ ĐẦU';
      } else if (idx === slideElements.length - 1) {
        elCounterBadge.textContent = 'KẾT THÚC';
      } else {
        const paddedCurrent = String(idx).padStart(2, '0');
        const paddedTotal = String(newsItems.length).padStart(2, '0');
        elCounterBadge.textContent = `${paddedCurrent} / ${paddedTotal}`;
      }
    }

    // 2. Floating Dots active class
    const dots = document.querySelectorAll('.nav-dot');
    dots.forEach((dot, dotIdx) => {
      if (dotIdx === idx) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // 3. Header Contrast when on dark slide
    if (elHeader) {
      if (slide.classList.contains('theme-dark')) {
        elHeader.classList.add('dark-slide-active');
      } else {
        elHeader.classList.remove('dark-slide-active');
      }
    }
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Cover "Bắt đầu khám phá" button
    const btnCoverStart = document.getElementById('btn-cover-start');
    if (btnCoverStart) {
      btnCoverStart.addEventListener('click', (e) => {
        e.preventDefault();
        navigateSlide(1);
      });
    }

    // Cue scroll bottom button
    const cueScroll = document.getElementById('cue-scroll');
    if (cueScroll) {
      cueScroll.addEventListener('click', (e) => {
        e.preventDefault();
        navigateSlide(1);
      });
    }

    // Return to Top on Closing Slide
    const btnBackTop = document.getElementById('btn-back-to-top');
    if (btnBackTop) {
      btnBackTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Detail Modal Events
    if (elDetailClose) elDetailClose.addEventListener('click', closeDetail);
    if (elDetailOverlay) {
      elDetailOverlay.addEventListener('click', (e) => {
        if (e.target === elDetailOverlay) closeDetail();
      });
    }

    // Table of Contents Events
    if (elBtnToc) elBtnToc.addEventListener('click', openTOC);
    if (elTocClose) elTocClose.addEventListener('click', closeTOC);
    if (elTocOverlay) {
      elTocOverlay.addEventListener('click', (e) => {
        if (e.target === elTocOverlay) closeTOC();
      });
    }

    // Deck Next / Prev Buttons
    if (elBtnPrev) {
      elBtnPrev.addEventListener('click', () => navigateSlide(-1));
    }
    if (elBtnNext) {
      elBtnNext.addEventListener('click', () => navigateSlide(1));
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // ESC closes active overlays
      if (e.key === 'Escape') {
        if (elDetailOverlay && elDetailOverlay.classList.contains('active')) {
          closeDetail();
          return;
        }
        if (elTocOverlay && elTocOverlay.classList.contains('active')) {
          closeTOC();
          return;
        }
      }

      // Do not navigate slides if an overlay is open
      if (elDetailOverlay?.classList.contains('active') || elTocOverlay?.classList.contains('active')) {
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        navigateSlide(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        navigateSlide(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (slideElements[0]) slideElements[0].scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        const last = slideElements[slideElements.length - 1];
        if (last) last.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  /**
   * Main App Initialization
   */
  async function init() {
    setupEventListeners();

    try {
      let response = await fetch(CONFIG.csvUrl);
      if (!response.ok) {
        response = await fetch(CONFIG.fallbackCsvUrl);
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} khi tải dữ liệu CSV`);
      }

      const csvText = await response.text();
      newsItems = parseCSV(csvText);

      if (!newsItems || newsItems.length === 0) {
        throw new Error('Dữ liệu CSV rỗng hoặc không đúng định dạng');
      }

      // Render All News Slides
      const closingSlide = document.getElementById('slide-closing');
      newsItems.forEach(item => {
        const slideEl = createNewsSlide(item);
        if (closingSlide) {
          elDeckContainer.insertBefore(slideEl, closingSlide);
        } else {
          elDeckContainer.appendChild(slideEl);
        }
      });

      // Cache all slides in presentation order
      slideElements = Array.from(document.querySelectorAll('.editorial-slide'));

      // Build Navigation Controls
      renderTOC();
      renderFloatingNav();
      setupScrollAndObservers();

    } catch (err) {
      console.error('Không thể khởi tạo Điểm Tin Tuần:', err);
      if (elDeckContainer) {
        const errDiv = document.createElement('div');
        errDiv.className = 'state-banner';
        errDiv.innerHTML = `
          <h3>Không thể tải dữ liệu điểm tin</h3>
          <p style="color: var(--c-text-secondary); margin-bottom: 16px;">
            Vui lòng kiểm tra file <code>data/news.csv</code>. Đảm bảo file tồn tại và đúng định dạng CSV.
          </p>
          <button class="btn-primary" onclick="window.location.reload();">Tải lại trang</button>
        `;
        elDeckContainer.appendChild(errDiv);
      }
    }
  }

  // Kickstart on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
