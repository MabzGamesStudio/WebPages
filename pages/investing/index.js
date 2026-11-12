// ── Global Chart Config ────────────────────────────
const CHART_COLORS = {
  primary: '#6c63ff',
  primaryLight: 'rgba(108, 99, 255, 0.12)',
  green: '#34d399',
  greenLight: 'rgba(52, 211, 153, 0.12)',
  red: '#f87171',
  grid: '#2e3344',
  text: '#9ca3af',
  bg: '#1a1d27',
};

const plotlyLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: {
    family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    color: CHART_COLORS.text,
    size: 12,
  },
  margin: { l: 60, r: 24, t: 40, b: 50 },
  xaxis: {
    title: { text: 'Year', font: { size: 13 } },
    gridcolor: CHART_COLORS.grid,
    linecolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.grid,
    tickformat: '.0f',
  },
  yaxis: {
    title: { text: 'Value ($)', font: { size: 13 } },
    gridcolor: CHART_COLORS.grid,
    linecolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.grid,
    tickprefix: '$',
    tickformat: ',.0f',
  },
  legend: {
    orientation: 'h',
    x: 0.5,
    xanchor: 'center',
    y: 1.12,
    font: { size: 12 },
  },
  hovermode: 'x unified',
  hoverlabel: {
    bgcolor: CHART_COLORS.bg,
    bordercolor: CHART_COLORS.grid,
    font: { family: 'Inter, sans-serif', size: 13, color: '#e4e4e7' },
  },
};

const plotlyConfig = {
  responsive: true,
  displayModeBar: false,
};

// ── Calculation ────────────────────────────────────
function calculateInvestmentGrowth(P, PMT, r, t) {
  const n = 12;
  const monthlyRate = r / 100 / n;
  const months = t * n;
  const data = [];

  let FV = P;
  let saved = P;

  for (let i = 1; i <= months; i++) {
    FV = FV * (1 + monthlyRate) + PMT;
    saved += PMT;
    data.push({ month: i, value: FV, saved });
  }

  return data;
}

// ── Helpers ────────────────────────────────────────
function formatCurrency(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 100_000) return '$' + Math.round(n).toLocaleString('en-US');
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── Plot & Summary ─────────────────────────────────
function plotInvestmentGrowth() {
  const P = parseFloat(document.getElementById('initial-investment').value) || 0;
  const PMT = parseFloat(document.getElementById('monthly-investment').value) || 0;
  const r = parseFloat(document.getElementById('return-rate').value) || 0;
  const y = parseFloat(document.getElementById('year-range').value) || 1;

  const data = calculateInvestmentGrowth(P, PMT, r, y);
  const startYear = new Date().getFullYear();
  const xValues = data.map(d => startYear + d.month / 12);
  const investedValues = data.map(d => d.value);
  const savedValues = data.map(d => d.saved);

  // ── Traces ──
  const traceInvested = {
    x: xValues,
    y: investedValues,
    type: 'scatter',
    mode: 'lines',
    name: 'With Investment Returns',
    line: { color: CHART_COLORS.green, width: 2.5, shape: 'spline' },
    fill: 'tozeroy',
    fillcolor: CHART_COLORS.greenLight,
  };

  const traceSaved = {
    x: xValues,
    y: savedValues,
    type: 'scatter',
    mode: 'lines',
    name: 'Just Saving (No Returns)',
    line: { color: CHART_COLORS.red, width: 2, dash: 'dot', shape: 'spline' },
    fill: 'tozeroy',
    fillcolor: 'rgba(248,113,113,0.06)',
  };

  Plotly.newPlot('graph', [traceInvested, traceSaved], plotlyLayout, plotlyConfig);

  // ── Summary ──
  const final = data[data.length - 1];
  const totalValue = final.value;
  const totalContributions = final.saved;
  const totalGains = totalValue - totalContributions;
  const gainsPct = totalContributions > 0 ? ((totalGains / totalContributions) * 100) : 0;

  document.getElementById('summary-total').textContent = formatCurrency(totalValue);
  document.getElementById('summary-contributions').textContent = formatCurrency(totalContributions);
  document.getElementById('summary-gains').textContent = formatCurrency(totalGains);
  document.getElementById('summary-years').textContent = y;
  document.getElementById('summary-gains-pct').textContent = '+' + gainsPct.toFixed(1) + '% return';
}

// ── Init ───────────────────────────────────────────
plotInvestmentGrowth();

const inputs = ['initial-investment', 'monthly-investment', 'return-rate', 'year-range'];
inputs.forEach(id => {
  document.getElementById(id).addEventListener('input', plotInvestmentGrowth);
});

// Redraw chart on window resize for responsiveness
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => Plotly.Plots.resize('graph'), 150);
});