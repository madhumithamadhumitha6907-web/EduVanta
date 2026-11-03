/**
 * DATABASE INDEXING & QUERY OPTIMIZATION CASE STUDY
 * Interactive Page Controller & Combinatorial Simulation Engine
 */

// ==========================================================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================================================
const TOTAL_PAGES = 12;
let currentPage = 1;

const DEFAULT_ATTRIBUTES = [
  "customer_id",
  "order_date",
  "order_status",
  "total_amount",
  "store_id",
  "region_code"
];

// ==========================================================================
// MATHEMATICAL CORE FUNCTIONS (BIGINT SAFE)
// ==========================================================================
function factorial(n) {
  if (n < 0) return 0n;
  if (n === 0 || n === 1) return 1n;
  let res = 1n;
  for (let i = 2n; i <= BigInt(n); i++) {
    res *= i;
  }
  return res;
}

function permutationsCount(n, r) {
  if (r < 0 || r > n) return 0n;
  return factorial(n) / factorial(n - r);
}

function combinationsCount(n, r) {
  if (r < 0 || r > n) return 0n;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function totalSubsetsCount(n) {
  if (n < 0) return 0n;
  return (2n ** BigInt(n)) - 1n;
}

// Generate Permutations (lexicographical)
function getPermutations(arr, r) {
  const result = [];
  function permute(current, remaining, targetLen) {
    if (current.length === targetLen) {
      result.push([...current]);
      return;
    }
    for (let i = 0; i < remaining.length; i++) {
      if (result.length >= 250) return; // Prevent browser freeze for huge n
      const nextRemaining = remaining.slice(0, i).concat(remaining.slice(i + 1));
      permute([...current, remaining[i]], nextRemaining, targetLen);
    }
  }
  permute([], arr, r);
  return result;
}

// Generate Combinations
function getCombinations(arr, r) {
  const result = [];
  function combine(start, current) {
    if (current.length === r) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      if (result.length >= 250) return; // Cap for browser rendering
      combine(i + 1, [...current, arr[i]]);
    }
  }
  combine(0, []);
  return result;
}

// ==========================================================================
// PAGE NAVIGATION ENGINE
// ==========================================================================
function goToPage(pageNum) {
  const target = Math.max(1, Math.min(TOTAL_PAGES, parseInt(pageNum, 10)));
  currentPage = target;

  // 1. Hide all pages, show target page
  const pages = document.querySelectorAll('.case-study-page');
  pages.forEach(p => {
    p.classList.remove('active-page');
    if (parseInt(p.getAttribute('data-page'), 10) === currentPage) {
      p.classList.add('active-page');
    }
  });

  // 2. Update Header Indicator
  const indPill = document.getElementById('headerPageIndicator');
  if (indPill) {
    indPill.innerHTML = `Page <strong>${currentPage}</strong> of ${TOTAL_PAGES}`;
  }

  // 3. Update Dropdown
  const selectElem = document.getElementById('pageJumpSelect');
  if (selectElem) {
    selectElem.value = currentPage.toString();
  }

  // 4. Update Quick Nav Pills
  const pills = document.querySelectorAll('.nav-pill-btn');
  pills.forEach(pill => {
    const pillPage = parseInt(pill.getAttribute('data-nav-page'), 10);
    if (pillPage === currentPage) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // 5. Update Prev/Next buttons
  const prevBtns = document.querySelectorAll('.btn-prev');
  const nextBtns = document.querySelectorAll('.btn-next');
  
  prevBtns.forEach(b => b.disabled = (currentPage === 1));
  nextBtns.forEach(b => b.disabled = (currentPage === TOTAL_PAGES));

  // 6. Update Progress Bar
  const progBar = document.getElementById('readingProgressBar');
  if (progBar) {
    const pct = ((currentPage) / TOTAL_PAGES) * 100;
    progBar.style.width = `${pct}%`;
  }

  // 7. Update Footer current page text
  const footerPageText = document.querySelectorAll('.current-page-num');
  footerPageText.forEach(t => t.textContent = currentPage.toString());

  // 8. Update URL hash without jumping
  window.history.replaceState(null, '', `#page-${currentPage}`);

  // Scroll smoothly to top of main card
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextPage() {
  if (currentPage < TOTAL_PAGES) {
    goToPage(currentPage + 1);
  }
}

function prevPage() {
  if (currentPage > 1) {
    goToPage(currentPage - 1);
  }
}

// ==========================================================================
// INTERACTIVE DEMONSTRATION LOGIC (PAGE 8)
// ==========================================================================
function updateCombinatorics() {
  const nInput = document.getElementById('inputN');
  const rInput = document.getElementById('inputR');
  if (!nInput || !rInput) return;

  let n = parseInt(nInput.value, 10);
  let r = parseInt(rInput.value, 10);

  // Bounds validation
  if (isNaN(n) || n < 1) n = 1;
  if (n > 10) n = 10; // Capped for UI responsiveness
  nInput.value = n;

  if (isNaN(r) || r < 1) r = 1;
  if (r > n) r = n;
  rInput.max = n;
  rInput.value = r;

  // Calculate values
  const totalPerm = factorial(n);
  const subsetPerm = permutationsCount(n, r);
  const subsetComb = combinationsCount(n, r);
  const totalSubsets = totalSubsetsCount(n);

  // Update Metric Cards
  const elTotalPerm = document.getElementById('metricTotalPerm');
  const elSubsetPerm = document.getElementById('metricSubsetPerm');
  const elSubsetComb = document.getElementById('metricSubsetComb');
  const elTotalSubsets = document.getElementById('metricTotalSubsets');

  if (elTotalPerm) elTotalPerm.textContent = totalPerm.toLocaleString();
  if (elSubsetPerm) elSubsetPerm.textContent = subsetPerm.toLocaleString();
  if (elSubsetComb) elSubsetComb.textContent = subsetComb.toLocaleString();
  if (elTotalSubsets) elTotalSubsets.textContent = totalSubsets.toLocaleString();

  // Active attributes for generator
  const activeAttrs = DEFAULT_ATTRIBUTES.slice(0, n);
  while (activeAttrs.length < n) {
    activeAttrs.push(`col_${activeAttrs.length + 1}`);
  }

  // Render Combinations List
  const combList = getCombinations(activeAttrs, r);
  const combContainer = document.getElementById('combinationsListOutput');
  if (combContainer) {
    if (combList.length === 0) {
      combContainer.innerHTML = '<div class="generated-item">No combinations found.</div>';
    } else {
      let html = '';
      combList.forEach((c, idx) => {
        html += `<div class="generated-item"><span><strong>[${idx + 1}]</strong> { ${c.join(', ')} }</span> <span class="badge-scan badge-good">Candidate Index Set</span></div>`;
      });
      if (subsetComb > BigInt(combList.length)) {
        html += `<div class="generated-item" style="color: var(--slate-500); font-style: italic;">... and ${subsetComb - BigInt(combList.length)} more candidate sets (display capped at 250).</div>`;
      }
      combContainer.innerHTML = html;
    }
  }

  // Render Permutations List (Evaluation Orders)
  const permList = getPermutations(activeAttrs, r);
  const permContainer = document.getElementById('permutationsListOutput');
  if (permContainer) {
    if (permList.length === 0) {
      permContainer.innerHTML = '<div class="generated-item">No permutations found.</div>';
    } else {
      let html = '';
      permList.forEach((p, idx) => {
        html += `<div class="generated-item"><span><strong>[${idx + 1}]</strong> ( ${p.join(' &rarr; ')} )</span> <span class="badge-scan badge-ok">Evaluation Order</span></div>`;
      });
      if (subsetPerm > BigInt(permList.length)) {
        html += `<div class="generated-item" style="color: var(--slate-500); font-style: italic;">... and ${subsetPerm - BigInt(permList.length)} more sequences (display capped at 250).</div>`;
      }
      permContainer.innerHTML = html;
    }
  }
}

// Induction Step Interactive Checker
function runInductionCheck() {
  const kInput = document.getElementById('inductionKInput');
  const resultDiv = document.getElementById('inductionCheckResult');
  if (!kInput || !resultDiv) return;

  const k = parseInt(kInput.value, 10);
  if (isNaN(k) || k < 1 || k > 15) {
    resultDiv.innerHTML = `<span style="color: var(--danger-crimson);">Please enter an integer k between 1 and 15.</span>`;
    return;
  }

  const pk = factorial(k);
  const kPlus1 = k + 1;
  const stepVal = BigInt(kPlus1) * pk;
  const directFactorial = factorial(kPlus1);
  const holds = (stepVal === directFactorial);

  resultDiv.innerHTML = `
    <div style="background: var(--pure-white); border: 1px solid var(--card-border-blue); border-radius: 6px; padding: 0.85rem; margin-top: 0.5rem;">
      <p style="margin-bottom: 0.3rem;"><strong>Hypothesis:</strong> Assume \( P(${k}) = ${k}! = ${pk.toLocaleString()} \) evaluation sequences.</p>
      <p style="margin-bottom: 0.3rem;"><strong>Inductive Step:</strong> Inserting index \( I_{${kPlus1}} \) into ${kPlus1} available slots:</p>
      <p style="font-family: var(--font-mono); font-size: 0.95rem; color: var(--secondary-navy); margin-bottom: 0.3rem;">
        P(${kPlus1}) = (${k} + 1) &times; P(${k}) = ${kPlus1} &times; ${pk.toLocaleString()} = <strong>${stepVal.toLocaleString()}</strong>
      </p>
      <p style="font-family: var(--font-mono); font-size: 0.95rem; color: var(--slate-700); margin-bottom: 0.4rem;">
        Direct (${kPlus1})! = <strong>${directFactorial.toLocaleString()}</strong>
      </p>
      <div style="display: flex; align-items: center; gap: 0.4rem; color: ${holds ? 'var(--success-green)' : 'var(--danger-crimson)'}; font-weight: 700;">
        <span>${holds ? '&#10004; Induction Step Verified: P(k+1) &#8801; (k+1)!' : '&#10008; Verification Failed'}</span>
      </div>
    </div>
  `;
}

// ==========================================
// QUERY EXECUTION COST SIMULATOR
// ==========================================
function simulateQueryPlan() {
  const rowsSelect = document.getElementById('simTableRows');
  const indexSelect = document.getElementById('simIndexConfig');
  const planName = document.getElementById('simPlanName');
  const matchedCols = document.getElementById('simMatchedCols');
  const pagesRead = document.getElementById('simPagesRead');
  const estLatency = document.getElementById('simEstLatency');
  const speedupEl = document.getElementById('simSpeedup');
  const explanationEl = document.getElementById('simExplanation');

  if (!rowsSelect || !indexSelect) return;

  const totalRows = parseInt(rowsSelect.value, 10);
  const config = indexSelect.value;
  // Query fixed predicates: customer_id = 'C1042' AND order_status = 'SHIPPED'
  const predicates = ["customer_id", "order_status"];
  const totalPages = Math.max(10, Math.floor(totalRows * 0.01)); // 100 rows per 8KB page
  const baselineScanMs = Math.round(totalPages * 0.045);

  let plan = "";
  let matchedCount = 0;
  let pages = 0;
  let latency = 0;
  let speedup = 1.0;
  let explanation = "";

  if (config === "none") {
    plan = "Sequential Table Scan (Full Table Scan)";
    matchedCount = 0;
    pages = totalPages;
    latency = baselineScanMs;
    speedup = 1.0;
    explanation = "No index is available. The database storage engine must read all disk pages from the physical storage sequentially to filter rows.";
  } else if (config === "opt_composite") {
    // Index on (customer_id, order_status)
    plan = "Optimal Composite B+Tree Seek (Index Seek + Key Lookup)";
    matchedCount = 2;
    pages = Math.max(3, Math.floor(Math.log10(totalRows))) + 1;
    latency = Math.max(0.4, Number((pages * 0.18).toFixed(2)));
    speedup = Math.round(baselineScanMs / latency);
    explanation = "Leading prefix matched completely! The B+Tree searches directly on customer_id, then narrows precisely by order_status within the leaf nodes.";
  } else if (config === "subopt_perm") {
    // Index on (order_status, customer_id)
    plan = "Suboptimal Permutation Index Scan (Low-Selectivity Leading Key)";
    matchedCount = 2; // matched but low selectivity leading prefix
    // order_status has only 3-5 distinct values, so the leading prefix matches 25-30% of entire tree!
    pages = Math.floor(totalPages * 0.22);
    latency = Math.max(1.5, Number((pages * 0.04).toFixed(2)));
    speedup = Math.max(1, Math.round(baselineScanMs / latency));
    explanation = "Because 'order_status' is the leading column, the optimizer must scan broad index ranges (thousands of 'SHIPPED' rows) before filtering by customer_id.";
  } else if (config === "unmatched_leading") {
    // Index on (order_date, customer_id)
    plan = "Index Skip Scan / Fallback Scan (Unmatched Leading Key)";
    matchedCount = 0;
    pages = Math.floor(totalPages * 0.75);
    latency = Math.max(2.0, Number((pages * 0.042).toFixed(2)));
    speedup = Math.max(1, Math.round(baselineScanMs / latency));
    explanation = "The leading column 'order_date' is absent from the query WHERE clause. Under the Leftmost Prefix Rule, standard tree traversal cannot be performed.";
  }

  // Update UI
  if (planName) planName.textContent = plan;
  if (matchedCols) matchedCols.textContent = `${matchedCount} / 2 Predicates`;
  if (pagesRead) pagesRead.textContent = `${pages.toLocaleString()} Pages`;
  if (estLatency) estLatency.textContent = `${latency.toLocaleString()} ms`;
  if (speedupEl) {
    speedupEl.textContent = `${speedup.toLocaleString()}x Faster`;
    speedupEl.className = speedup > 20 ? 'badge-scan badge-good' : (speedup > 1 ? 'badge-scan badge-ok' : 'badge-scan badge-bad');
  }
  if (explanationEl) explanationEl.textContent = explanation;
}

// ==========================================
// DEMO SUB-TABS CONTROLLER (PAGE 8)
// ==========================================
function setupDemoSubtabs() {
  const tabs = document.querySelectorAll('.demo-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPaneId = tab.getAttribute('data-target-pane');
      tabs.forEach(t => t.classList.remove('active-subtab'));
      tab.classList.add('active-subtab');

      const panes = document.querySelectorAll('.subtab-pane');
      panes.forEach(p => {
        p.classList.remove('active-pane');
        if (p.id === targetPaneId) {
          p.classList.add('active-pane');
        }
      });
    });
  });
}

// ==========================================
// KEYBOARD & USER INTERACTION LISTENERS
// ==========================================
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Ignore keys if inside an input or textarea
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prevPage();
    } else if (e.key >= '1' && e.key <= '9') {
      goToPage(parseInt(e.key, 10));
    }
  });
}

// Editable Title Page persistence (saved in localStorage for student convenience)
function setupTitlePageEditing() {
  const editables = document.querySelectorAll('.placeholder-editable');
  editables.forEach((el, index) => {
    const saved = localStorage.getItem(`casestudy_meta_${index}`);
    if (saved) {
      el.textContent = saved;
    }
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('title', 'Click to edit details');
    el.addEventListener('blur', () => {
      localStorage.setItem(`casestudy_meta_${index}`, el.textContent.trim());
    });
  });
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Check URL hash for initial page
  const hash = window.location.hash;
  if (hash && hash.startsWith('#page-')) {
    const pageFromHash = parseInt(hash.replace('#page-', ''), 10);
    if (!isNaN(pageFromHash) && pageFromHash >= 1 && pageFromHash <= TOTAL_PAGES) {
      currentPage = pageFromHash;
    }
  }

  // Setup header select change
  const selectElem = document.getElementById('pageJumpSelect');
  if (selectElem) {
    selectElem.addEventListener('change', (e) => {
      goToPage(parseInt(e.target.value, 10));
    });
  }

  // Setup quick nav pills
  const pills = document.querySelectorAll('.nav-pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      goToPage(parseInt(pill.getAttribute('data-nav-page'), 10));
    });
  });

  // Setup Prev/Next buttons
  document.querySelectorAll('.btn-prev').forEach(b => b.addEventListener('click', prevPage));
  document.querySelectorAll('.btn-next').forEach(b => b.addEventListener('click', nextPage));

  // Setup calculator listeners
  const nInput = document.getElementById('inputN');
  const rInput = document.getElementById('inputR');
  if (nInput) nInput.addEventListener('input', updateCombinatorics);
  if (rInput) rInput.addEventListener('input', updateCombinatorics);

  const btnInduction = document.getElementById('btnRunInduction');
  if (btnInduction) btnInduction.addEventListener('click', runInductionCheck);

  const simRows = document.getElementById('simTableRows');
  const simIndex = document.getElementById('simIndexConfig');
  if (simRows) simRows.addEventListener('change', simulateQueryPlan);
  if (simIndex) simIndex.addEventListener('change', simulateQueryPlan);

  // Initialize features
  setupDemoSubtabs();
  setupKeyboardNavigation();
  setupTitlePageEditing();
  goToPage(currentPage);
  updateCombinatorics();
  runInductionCheck();
  simulateQueryPlan();
});
