'use client';
// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ================= THEME ================== */
const JSW_COLORS = {
  primary: 'var(--brand)', // blue
  accent: 'var(--brand-accent)', // (kept if needed later)
  light: '#f6f8fb',
  ink: 'var(--brand-ink)',
};

/* =============== HELPERS =================== */
const fmtInt = (n: any) =>
  Number.isFinite(+n)
    ? Math.round(+n).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '—';
const INR = (n: any) => (Number.isFinite(+n) ? `₹${fmtInt(n)}` : '—');
const monYY = (isoOrYm: any) => {
  const s = String(isoOrYm);
  const y = s.slice(0, 4);
  const m = Number(s.slice(5, 7));
  const names = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  if (!y || !m || !names[m - 1]) return s;
  return `${names[m - 1]}-${y.slice(2)}`;
};
// Small getter for raw row keys with fuzzy column names
const rget = (row: any, ...names: any[]) => {
  if (!row) return undefined;
  for (const n of names) {
    if (row[n] !== undefined) return row[n];
    const t = (typeof n === 'string' ? n : '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    for (const k of Object.keys(row)) {
      if (String(k).replace(/\s+/g, ' ').trim().toLowerCase() === t)
        return row[k];
    }
  }
  return undefined;
};

/* ======== SAMPLE (replaced by uploaded data) ========= */
let SAMPLE = {
  customers: [
    {
      id: 'C001',
      name: 'Agrawal Steel Traders',
      region: 'West',
      state: 'Maharashtra',
      city: 'Mumbai',
      masterSegment: 'Transactional', // Added sample data
      products: [
        { category: 'HRC', sku: 'E250A' },
        { category: 'Coated', sku: 'AZ70' },
      ],
    },
    {
      id: 'C002',
      name: 'Shreekrishna Steels',
      region: 'West',
      state: 'Maharashtra',
      city: 'Pune',
      masterSegment: 'Strategic', // Added sample data
      products: [{ category: 'TMT', sku: 'Fe550D' }],
    },
    {
      id: 'C003',
      name: 'Khyati Steel Corporation Group',
      region: 'West',
      state: 'Gujarat',
      city: 'Ahmedabad',
      masterSegment: 'Transactional / Long Tail', // Added sample data
      products: [
        { category: 'HRC', sku: 'E250A' },
        { category: 'TMT', sku: 'Fe550D' },
      ],
    },
  ],
  segments: [],
  marketIndex: {
    'West|HRC': [
      { date: '2025-09-15', index: 47950 },
      { date: '2025-09-22', index: 48200 },
      { date: '2025-09-29', index: 48650 },
      { date: '2025-10-06', index: 48400 },
      { date: '2025-10-13', index: 48750 },
      { date: '2025-10-20', index: 49000 },
    ],
  },
  txns: [],
};

/* =============== UI PRIMITIVES ================= */
// [NO CHANGE] This is the original SectionCard component from your file
function SectionCard({
  title,
  subtitle,
  children,
  right,
  className = '',
  bodyClassName = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 max-w-full overflow-hidden ${className}`}
    >
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h3
              className="text-base md:text-lg font-semibold truncate"
              style={{ color: JSW_COLORS.ink }}
            >
              {title}
            </h3>
          </div>
          <div className="text-xs text-slate-500 flex-shrink-0 break-words">
            {right}
          </div>
        </div>
        {subtitle && (
          <p className="text-sm text-slate-700 mt-2">{subtitle}</p>
        )}
      </div>
      <div
        className={`p-4 sm:p-6 text-sm leading-relaxed break-words ${bodyClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

// [NO CHANGE] This is the original Modal component from your file
function Modal({ title, open, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[95vw] max-w-6xl max-h-[85vh] rounded-2xl shadow-xl border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3
            className="text-lg font-semibold"
            style={{ color: JSW_COLORS.primary }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 text-sm px-3 py-1 rounded-lg border"
          >
            Close
          </button>
        </div>
        <div
          className="p-4 overflow-auto"
          style={{ maxHeight: 'calc(85vh - 120px)' }}
        >
          {children}
        </div>
        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-between gap-2">
          {footer}
        </div>
      </div>
    </div>
  );
}

// [NO CHANGE] This is the original Sidebar component from your file
function Sidebar({ open, setOpen }) {
  const logoUrl =
    'https://e7.pngegg.com/pngimages/723/866/png-clipart-jsw-group-india-jsw-steel-ltd-chief-executive-conglomerate-india-blue-company.png';
  const NavIcon = ({ children }) => (
    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
      {children}
    </div>
  );
  const NavItem = ({ icon, text, active = false }) => (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer ${
        active ? 'text-white' : 'text-slate-300 hover:bg-white/10'
      }`}
      style={active ? { background: 'var(--brand-accent)' } : {}}
    >
      <NavIcon>{icon}</NavIcon>
      <span
        className={`font-medium transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {text}
      </span>
    </div>
  );
  // Icons
  const PricingIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v0m0 10c-1.657 0-3-.895-3-2s1.343-2 3-2 3-.895 3-2-1.343-2-3-2m0 10V11m0 10h.01M12 11h.01M12 11V7m0 10V7m0 0h.01M12 7h.01"
      />
    </svg>
  );
  const MenuIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
  return (
    <div
      className={`fixed top-0 left-0 h-full text-white p-4 transition-all duration-300 z-30 ${
        open ? 'w-64' : 'w-20'
      }`}
      style={{ background: 'var(--brand)' }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 h-12 mb-6">
          <img
            src={logoUrl}
            alt="JSW Logo"
            className={`h-10 transition-all duration-300 ${
              open ? 'w-auto' : 'w-10'
            }`}
          />
          <span
            className={`font-semibold text-lg transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          >
            JSW
          </span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-2">
          <NavItem icon={PricingIcon} text="Customer Pricing" active />
        </nav>

        {/* Footer Toggle */}
        <div className="mt-auto">
          <div
            className="flex items-center gap-4 p-3 rounded-lg cursor-pointer text-slate-300 hover:bg-white/10"
            onClick={() => setOpen(!open)}
          >
            <NavIcon>{MenuIcon}</NavIcon>
            <span
              className={`font-medium transition-opacity duration-200 ${
                open ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Collapse
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== APP ===================== */
export default function App() {
  // Data state
  const [customers, setCustomers] = useState(SAMPLE.customers);
  const [segments, setSegments] = useState(SAMPLE.segments);
  const [marketIndex, setMarketIndex] = useState(SAMPLE.marketIndex);
  const [txns, setTxns] = useState(SAMPLE.txns);
  const [customerMonthly, setCustomerMonthly] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [segDescMap, setSegDescMap] = useState({});
  // key: SKU|Segment__node -> description

  // Deep-dive modal state
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeRows, setRangeRows] = useState([]);
  const [rangeFYOnly, setRangeFYOnly] = useState(true);
  const [rangeExcludeOutliers, setRangeExcludeOutliers] = useState(true);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');

  // Keep customer in sync if data loads
  useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || customers[0],
    [customers, customerId],
  );

  const categoriesForCustomer = useMemo(
    () =>
      Array.from(
        new Set((selectedCustomer?.products || []).map((p) => p.category)),
      ),
    [selectedCustomer],
  );
  const [category, setCategory] = useState(categoriesForCustomer[0] || 'HRC');

  const skusForCategory = useMemo(
    () =>
      (selectedCustomer?.products || [])
        .filter((p) => p.category === category)
        .map((p) => p.sku),
    [selectedCustomer, category],
  );
  const [sku, setSku] = useState(skusForCategory[0] || '');

  const widths = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku,
      )
      .map((t) => t.width)
      .filter((v) => v != null);
    return Array.from(new Set(pool));
  }, [txns, customerId, category, sku]);
  const thicknesses = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku,
      )
      .map((t) => t.thickness)
      .filter((v) => v != null);
    return Array.from(new Set(pool));
  }, [txns, customerId, category, sku]);
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [qty, setQty] = useState(100);
  // Region/State/City filtered to the selection
  const regions = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku,
      )
      .map((t) => t.region)
      .filter(Boolean);
    const fallback = customers.map((c) => c.region).filter(Boolean);
    return Array.from(new Set(pool.length ? pool : fallback));
  }, [txns, customers, customerId, category, sku]);
  const [region, setRegion] = useState(
    selectedCustomer?.region || regions[0] || '',
  );
  const statesForRegion = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku &&
          (!region || t.region === region),
      )
      .map((t) => t.state)
      .filter(Boolean);
    const fallback = customers
      .filter((c) => !region || c.region === region)
      .map((c) => c.state)
      .filter(Boolean);
    return Array.from(new Set(pool.length ? pool : fallback));
  }, [txns, customers, customerId, category, sku, region]);
  const [stateName, setStateName] = useState(
    selectedCustomer?.state || statesForRegion[0] || '',
  );
  const citiesForState = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku &&
          (!region || t.region === region) &&
          (!stateName || t.state === stateName),
      )
      .map((t) => t.city)
      .filter(Boolean);
    const fallback = customers
      .filter((c) => !stateName || c.state === stateName)
      .map((c) => c.city)
      .filter(Boolean);
    return Array.from(new Set(pool.length ? pool : fallback));
  }, [txns, customers, customerId, category, sku, region, stateName]);
  const [city, setCity] = useState(
    selectedCustomer?.city || citiesForState[0] || '',
  );

  // Keep dependent state in sync
  useEffect(() => {
    setCategory(categoriesForCustomer[0] || 'HRC');
  }, [JSON.stringify(categoriesForCustomer)]); // Use JSON.stringify for array dependency
  useEffect(() => {
    setSku(skusForCategory[0] || '');
  }, [JSON.stringify(skusForCategory)]); // Use JSON.stringify for array dependency
  useEffect(() => {
    setWidth(widths.length ? String(widths[0]) : '');
    setThickness(thicknesses.length ? String(thicknesses[0]) : '');
  }, [sku, JSON.stringify(widths), JSON.stringify(thicknesses)]);
  useEffect(() => {
    setRegion(selectedCustomer?.region || regions[0] || '');
  }, [selectedCustomer, JSON.stringify(regions)]);
  useEffect(() => {
    setStateName(selectedCustomer?.state || statesForRegion[0] || '');
  }, [selectedCustomer, JSON.stringify(statesForRegion)]);
  useEffect(() => {
    setCity(selectedCustomer?.city || citiesForState[0] || '');
  }, [selectedCustomer, JSON.stringify(citiesForState)]);

  // ===== Derived outputs =====
  const eligibleNodes = useMemo(() => {
    const rows = (rawRows || []).filter(
      (r) =>
        String(rget(r, 'SKU')) === sku &&
        String(rget(r, 'Customer Name', 'Ship to Party Name', 'cust')) ===
          selectedCustomer?.name,
    );
    return Array.from(
      new Set(rows.map((r) => rget(r, 'Segment__node')).filter((v) => v != null)),
    ).sort((a, b) => Number(a) - Number(b));
  }, [rawRows, sku, selectedCustomer]);
  const [segmentNode, setSegmentNode] = useState(eligibleNodes[0] ?? '');

  useEffect(() => {
    setSegmentNode(eligibleNodes[0] ?? '');
  }, [JSON.stringify(eligibleNodes)]);

  const segKey = useMemo(
    () => (segmentNode ? `${sku}|${segmentNode}` : null),
    [sku, segmentNode],
  );
  const seg = useMemo(
    () => (segKey ? (segments || []).find((s) => s.key === segKey) : null),
    [segments, segKey],
  );
  const segDesc = segKey ? segDescMap[segKey] || '—' : '—';
  const recentTxns = useMemo(
    () =>
      (txns || [])
        .filter(
          (t) =>
            t.customerId === customerId &&
            t.category === category &&
            t.sku === sku,
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 10),
    [txns, customerId, category, sku],
  );
  const lastTxnForNode = useMemo(
    () =>
      (txns || [])
        .filter(
          (t) =>
            t.customerId === customerId &&
            t.category === category &&
            t.sku === sku &&
            String(t.segmentNode) === String(segmentNode),
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0],
    [txns, customerId, category, sku, segmentNode],
  );
  const indexSeries =
    marketIndex[`${region}|${category}`] ||
    marketIndex[`All|${category}`] ||
    [];

  const monthlyMap = useMemo(() => {
    const m = new Map();
    (customerMonthly || [])
      .filter(
        (r) =>
          (r.customerId === customerId ||
            r.customerName === selectedCustomer?.name) &&
          r.category === category &&
          r.sku === sku,
      )
      .forEach((r) => m.set(String(r.month), Number(r.realizedPrice)));
    return m;
  }, [customerMonthly, customerId, selectedCustomer, category, sku]);
  const selectionTxns = useMemo(
    () =>
      (txns || []).filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku,
      ),
    [txns, customerId, category, sku],
  );
  const txnPriceByDate = useMemo(() => {
    const m = new Map();
    selectionTxns.forEach((t) => {
      const d = (t.date || '').toString().slice(0, 7);
      const w = Number(t.qty || 0) || 1;
      const p = Number(t.dealPrice || 0);
      if (!d) return;
      if (!m.has(d)) m.set(d, { w: 0, v: 0 });
      const o = m.get(d);
      o.w += w;
      o.v += p * w;
    });
    const out = new Map();
    m.forEach((agg, d) => out.set(d, Math.round(agg.v / agg.w)));
    return out;
  }, [selectionTxns]);
  const combinedSeries = useMemo(() => {
    const hasMonthly = monthlyMap.size > 0;
    if (hasMonthly) {
      return (indexSeries || []).map((p) => {
        const ym = String(p.date).slice(0, 7);
        return {
          date: monYY(p.date),
          index: Math.round(p.index),
          cust: monthlyMap.get(ym) ?? null,
        };
      });
    }
    return (indexSeries || []).map((p) => ({
      date: monYY(p.date),
      index: Math.round(p.index),
      cust: txnPriceByDate.get(String(p.date).slice(0, 7)) ?? null,
    }));
  }, [indexSeries, monthlyMap, txnPriceByDate]);
  // ====== Behaviour summary ======
  const mode = (arr) => {
    const m = new Map();
    arr.forEach((v) => m.set(v, (m.get(v) || 0) + 1));
    let best = null,
      cnt = -1;
    m.forEach((c, v) => {
      if (c > cnt) {
        cnt = c;
        best = v;
      }
    });
    return best;
  };
  const lakhs = (n) =>
    n == null || isNaN(Number(n))
      ? '—'
      : `₹${Math.round(Number(n) / 100000).toLocaleString()} L`;
  function computeBehaviorChips() {
    const rows = (rawRows || []).filter(
      (r) =>
        String(rget(r, 'Customer Name', 'Ship to Party Name', 'cust')) ===
          selectedCustomer?.name && String(rget(r, 'SKU')) === sku,
    );
    const pick = (c) =>
      rows.map((r) => rget(r, c)).filter((x) => x !== undefined && x !== null);
    const monthsRaw = Array.from(
      new Set(pick('Month').map((v) => String(v).slice(0, 7))),
    );
    const monthsFmt = monthsRaw
      .filter((ym) => /^\d{4}-\d{2}$/.test(ym))
      .sort((a, b) => (a < b ? -1 : 1))
      .map((ym) => monYY(ym + '-01'));
    const plants = pick('Plant').filter(Boolean);
    const preferredPlant = plants.length ? mode(plants) : '—';
    const qtyBin = (() => {
      const q = pick('Quantity_Bin').filter(Boolean);
      return q.length ? mode(q) : '—';
    })();
    const annualSales = pick('Customer Annual Sales (INR)')
      .map(Number)
      .find((n) => !Number.isNaN(n));
    const uniqueSkuCount = pick('Unique_Products_Count')
      .map(Number)
      .find((n) => !Number.isNaN(n));
    const relShareRaw = pick('Rel_prod_share_per_cust')
      .map(Number)
      .find((n) => !Number.isNaN(n));
    const relPct =
      relShareRaw != null
        ? relShareRaw > 1
          ? Math.round(relShareRaw)
          : Math.round(relShareRaw * 100)
        : null;
    return [
      ['Plant', preferredPlant],
      ['Months active', monthsFmt.length ? monthsFmt.join(', ') : '—'],
      ['Quantity', qtyBin],
      ['Annual sales (FY24–25)', lakhs(annualSales)],
      [
        '# unique SKUs (last year)',
        uniqueSkuCount != null ? String(uniqueSkuCount) : '—',
      ],
      ['Rel. share of this SKU', relPct != null ? `${relPct}%` : '—'],
    ];
  }
  function computeOneLiner() {
    const mRows = (customerMonthly || []).filter(
      (r) =>
        (r.customerId === selectedCustomer?.id ||
          r.customerName === selectedCustomer?.name) &&
        r.category === category &&
        r.sku === sku,
    );
    const rRows = (rawRows || []).filter(
      (r) =>
        String(rget(r, 'Customer Name', 'Ship to Party Name', 'cust')) ===
          selectedCustomer?.name && String(rget(r, 'SKU')) === sku,
    );
    if (!mRows.length && !rRows.length)
      return `${
        selectedCustomer?.name || 'Customer'
      } – no recent purchases for ${sku}.`;

    const monthToQty = new Map();
    rRows.forEach((r) => {
      const m = String(rget(r, 'Month') || '');
      const q = Number(rget(r, 'quantity (MT)') || 0) || 0;
      if (!m) return;
      monthToQty.set(m, (monthToQty.get(m) || 0) + q);
    });
    const activeMonths = Array.from(monthToQty.keys()).map((ym) =>
      monYY(String(ym).slice(0, 7) + '-01'),
    );
    const topMonths = Array.from(monthToQty.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([m]) => monYY(String(m).slice(0, 7) + '-01'));
    const cities = rRows.map((r) => rget(r, 'Ship To City')).filter(Boolean);
    const preferredCity = cities.length ? mode(cities) : mRows[0]?.city || '—';
    const plants = rRows.map((r) => rget(r, 'Plant')).filter(Boolean);
    const preferredPlant = plants.length ? mode(plants) : '—';
    const industry = mRows[0]?.endUseIndustry || rRows[0]?.endUseIndustry;

    const qtyBins = rRows.map((r) => rget(r, 'Quantity_Bin')).filter(Boolean);
    const qbin = qtyBins.length ? mode(qtyBins) : undefined;
    const qtyPhrase = (() => {
      const m = { H: 'High', M: 'Medium', L: 'Low' };
      if (!qbin) return 'Medium';
      const up = String(qbin).trim().toUpperCase();
      return m[up] || qbin;
    })();

    return [
      `${selectedCustomer?.name} – ${qtyPhrase} annual quantity${
        industry ? `, operating in ${industry},` : ''
      } buyer of ${sku}.`,
      activeMonths.length
        ? `They purchased this SKU in ${
            activeMonths.length
          } months in FY25 (peak in ${topMonths.join(', ')})`
        : '',
      `and prefer ${
        preferredPlant !== '—' ? preferredPlant : '—'
      } plant and usually ship to ${preferredCity}.`,
    ]
      .filter(Boolean)
      .join(' ');
  }
  const behaviorChips = useMemo(
    () => computeBehaviorChips(),
    [rawRows, selectedCustomer, sku],
  );
  const oneLiner = useMemo(
    () => computeOneLiner(),
    [rawRows, customerMonthly, selectedCustomer, sku, category],
  );
  const badge = (label, value) => (
    <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1 border border-slate-200">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
  
  // [CHANGE 1] This is the derived value for the new card
  const masterSegment = selectedCustomer?.masterSegment || '—';

  /* ============ Upload handlers ============ */
  async function handleDescUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    const assignMap = (arr: any[]) => {
      const map = {};
      arr.forEach((r) => {
        const SKU = rget(r, 'SKU', 'sku', 'Sku', 'SO-JSW Grade');
        const node = rget(
          r,
          'Segment__node',
          'segment__node',
          'Segment Node',
          'Segment_Node',
        );
        const desc = rget(
          r,
          'Segment_Description',
          'SegmentDescription',
          'Description',
          'Segment Description',
        );
        if (SKU && node !== undefined && node !== null && desc) {
          map[`${String(SKU)}|${String(node)}`] = String(desc);
        }
      });
      setSegDescMap((prev) => ({ ...prev, ...map }));
    };
    if (name.endsWith('.csv')) {
      const Papa = (await import('papaparse')).default;
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => assignMap((data as any[]) || []),
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(new Uint8Array(evt.target.result as ArrayBuffer), {
        type: 'array',
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      assignMap(rows);
    };
    reader.readAsArrayBuffer(f);
  }

  async function handleDataUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    if (name.endsWith('.csv')) {
      const Papa = (await import('papaparse')).default;
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          const rows = (data as any[]) || [];
          const hasMonthly =
            rows[0] && rget(rows[0], 'month', 'Month', 'YYYY-MM');
          if (hasMonthly) {
            // This is the Customer Monthly path
            const cm = rows.map((r) => ({
              customerId: rget(r, 'customerId', 'CustomerId', 'Customer ID'),
              customerName: rget(
                r,
                'customerName',
                'CustomerName',
                'Customer Name',
              ),
              category: rget(r, 'category', 'Category') || 'HRC',
              sku: rget(r, 'sku', 'SKU'),
              month: String(rget(r, 'month', 'Month', 'YYYY-MM')),
              realizedPrice: Number(
                rget(r, 'realizedPrice', 'RealizedPrice', 'realized_price') ||
                  0,
              ),
              qty: Number(rget(r, 'qty', 'quantity', 'Quantity') || 0),
              region: rget(r, 'region', 'Region'),
              state: rget(r, 'state', 'State'),
              city: rget(r, 'city', 'City'),
              endUseIndustry: rget(
                r,
                'endUseIndustry',
                'industry',
                'end use industry',
              ),
              // [CHANGE #2] Read Master Segment here
              masterSegment: rget(r, 'Master_Segment', 'Master Segment'),
            }));
            setCustomerMonthly(cm);

            // Infer customers from this file
            const custMap = new Map();
            cm.forEach((r) => {
              if (!r.customerId && !r.customerName) return;
              const cid = r.customerId || r.customerName;
              if (!custMap.has(cid)) {
                custMap.set(cid, {
                  id: cid,
                  name: r.customerName || cid,
                  region: r.region,
                  state: r.state,
                  city: r.city,
                  masterSegment: r.masterSegment, // [CHANGE #2] Store Master Segment
                  products: [],
                });
              }
              const cust = custMap.get(cid);
              if (
                r.category &&
                r.sku &&
                !cust.products.some(
                  (p) => p.category === r.category && p.sku === r.sku,
                )
              ) {
                cust.products.push({ category: r.category, sku: r.sku });
              }
            });
            if (custMap.size > 0) setCustomers(Array.from(custMap.values()));

            // Infer market index
            const idx = {};
            cm.forEach((r) => {
              const k = `All|${r.category || 'HRC'}`;
              if (!idx[k]) idx[k] = [];
              if (!idx[k].some((x) => x.date === r.month))
                idx[k].push({ date: r.month, index: r.realizedPrice });
            });
            if (Object.keys(idx).length)
              setMarketIndex((prev) =>
                Object.keys(prev || {}).length ? prev : idx,
              );
            return;
          }
          // This is the Transactions CSV path
          const custMap = new Map();
          const tx = [];
          rows.forEach((r, i) => {
            const cid =
              rget(
                r,
                'customerId',
                'customer_id',
                'CustomerId',
                'CustomerID',
                'Customer',
              ) || `U_${i}`;
            const nm =
              rget(
                r,
                'customerName',
                'customer',
                'CustomerName',
                'Customer Name',
              ) || cid;
            const region = rget(r, 'region', 'Region') || '';
            const state = rget(r, 'state', 'State') || '';
            const city = rget(r, 'city', 'City') || '';
            const category = (
              rget(
                r,
                'category',
                'Category',
                'ProductCategory',
                'Product Category',
              ) || 'HRC'
            ).toString();
            const sku = (
              rget(r, 'sku', 'SKU', 'SO-JSW Grade', 'SKU') || ''
            ).toString();
            
            // [CHANGE #2] Read Master Segment here
            const masterSegment = rget(r, 'Master_Segment', 'Master Segment');

            if (!custMap.has(cid))
              custMap.set(cid, {
                id: cid,
                name: nm,
                region,
                state,
                city,
                masterSegment: masterSegment, // [CHANGE #2] Store Master Segment
                products: [{ category, sku }],
              });
            else {
              const cust = custMap.get(cid);
              if (
                !cust.products.some(
                  (p) => p.category === category && p.sku === sku,
                )
              ) {
                cust.products.push({ category, sku });
              }
              if (!cust.masterSegment) { // Only add if not already set
                cust.masterSegment = masterSegment;
              }
            }
            
            tx.push({
              customerId: cid,
              category,
              sku,
              width: rget(r, 'width', 'Width')
                ? Number(rget(r, 'width', 'Width'))
                : null,
              thickness: rget(r, 'thickness', 'Thickness')
                ? Number(rget(r, 'thickness', 'Thickness'))
                : null,
              region,
              state,
              city,
              dealPrice: Number(
                rget(
                  r,
                  'dealPrice',
                  'price',
                  'Deal Price',
                  'Actual NSR Per MT',
                  'Current Price (INR per MT)', // Added from your file
                ) || 0,
              ),
              marketIndex: Number(
                rget(r, 'marketIndex', 'index', 'Market Index', 'Market', 'Market Index - Monthly_Average_Price') || 0, // Added from your file
              ),
              qty: Number(
                rget(r, 'qty', 'quantity', 'Quantity', 'Actual Sales Qty', 'quantity (MT)') || 0, // Added from your file
              ),
              date: (
                rget(r, 'date', 'Date', 'Txn Date', 'SO Date', 'Month') || '' // Added from your file
              ).toString(),
              segmentNode: rget(r, 'Segment__node'), // Added from your file
            });
          });
          setTxns(tx.sort((a, b) => (a.date < b.date ? 1 : -1)));
          setCustomers(Array.from(custMap.values()));
          setRawRows(rows); // Also save raw rows from CSV
        },
      });
      return;
    }
    
    // This is the XLSX path (for single flat sheet)
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const XLSX = await import('xlsx');
      const data = new Uint8Array(evt.target.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws);
      const get = rget;
      const custMap = new Map();
      const monthSeries = [];
      const idxByMonth = new Map();
      const segAgg = new Map();
      const tx = [];
      const segDescFromFile = {};
      
      rows.forEach((r: any, i) => {
        const customerName =
          get(r, 'Customer Name', 'Ship to Party Name', 'cust') || `U_${i}`;
        const cid = customerName; // id = name for demo
        const sku = get(r, 'SKU');
        const category = 'HRC';
        const month = String(get(r, 'Month') || '');
        const region = get(r, 'Region') || '';
        const state = get(r, 'State') || '';
        const city = get(r, 'Ship To City') || '';
        const qty = Number(get(r, 'quantity (MT)') || 0);
        const price = Number(get(r, 'Current Price (INR per MT)') || 0);
        const mi = Number(get(r, 'Market Index - Monthly_Average_Price') || 0);
        const node = get(r, 'Segment__node');
        
        // [CHANGE #2] Read Master Segment here
        const masterSegment = get(r, 'Master_Segment', 'Master Segment');

        if (!custMap.has(cid))
          custMap.set(cid, {
            id: cid,
            name: customerName,
            region,
            state,
            city,
            masterSegment: masterSegment, // [CHANGE #2] Store Master Segment
            products: [{ category, sku }],
          });
        else {
          const cust = custMap.get(cid);
          if (
            !cust.products.some(
              (p) => p.category === category && p.sku === sku,
            )
          ) {
            cust.products.push({ category, sku });
          }
          if (!cust.masterSegment) { // Only add if not already set
             cust.masterSegment = masterSegment;
          }
        }
        
        if (month && price > 0)
          monthSeries.push({
            customerId: cid,
            customerName,
            category,
            sku,
            month,
            realizedPrice: price,
            qty,
            region,
            state,
            city,
            endUseIndustry: get(r, 'End Use industry'),
            masterSegment: masterSegment, // [CHANGE #2] Also store in monthly if needed
          });
        if (month && mi > 0 && !idxByMonth.has(month))
          idxByMonth.set(month, mi);
        const nodeKey = `${sku}|${node}`;
        if (
          sku &&
          node !== undefined &&
          node !== null &&
          (price > 0 || qty > 0)
        ) {
          if (!segAgg.has(nodeKey))
            segAgg.set(nodeKey, { prices: [], qtys: [] });
          segAgg.get(nodeKey).prices.push(price);
          segAgg.get(nodeKey).qtys.push(qty);
        }
        const desc = get(
          r,
          'Segment_Description',
          'SegmentDescription',
          'Description',
          'Segment Description',
        );
        if (nodeKey && desc && !segDescFromFile[nodeKey])
          segDescFromFile[nodeKey] = desc;
        if (price > 0 && qty > 0)
          tx.push({
            customerId: cid,
            category,
            sku,
            width: null,
            thickness: null,
            region,
            state,
            city,
            dealPrice: price,
            marketIndex: mi,
            qty,
            date: month + '-01', // approx date
            segmentNode: node,
          });
      });
      setCustomers(Array.from(custMap.values()));
      setCustomerMonthly(monthSeries);
      const miData = Array.from(idxByMonth.entries())
        .map(([date, index]) => ({ date, index }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      setMarketIndex((prev) =>
        Object.keys(prev || {}).length
          ? prev
          : { [`All|HRC`]: miData, [`${region}|HRC`]: miData },
      );
      const segs = Array.from(segAgg.entries()).map(
        ([key, { prices, qtys }]: any) => {
          const p = prices.filter((p) => p > 0).sort((a, b) => a - b);
          const min = p[0] ?? 0;
          const max = p[p.length - 1] ?? 0;
          const q1 = p[Math.floor(p.length * 0.25)] ?? min;
          const q3 = p[Math.floor(p.length * 0.75)] ?? max;
          const totalQty = qtys.reduce((a, b) => a + b, 0);
          return { key, minPrice: q1, maxPrice: q3, totalQty };
        },
      );
      setSegments(segs);
      setTxns(tx.sort((a, b) => (a.date < b.date ? 1 : -1)));
      setRawRows(rows);
      setSegDescMap(segDescFromFile);
    };
    reader.readAsArrayBuffer(f);
  }

  async function handleFullUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const XLSX = await import('xlsx');
    const data = await f.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const get = rget;
    const sheet = (name: string) => {
      const ws = wb.Sheets[name];
      if (!ws) {
        console.warn(`Sheet "${name}" not found.`);
        return [];
      }
      return XLSX.utils.sheet_to_json(ws);
    };
    // 1. Customers
    const custMap = new Map();
    sheet('Customers').forEach((r: any) => {
      const id = get(r, 'id', 'Customer ID');
      if (!id) return;
      custMap.set(String(id), {
        id: String(id),
        name: get(r, 'name', 'Customer Name'),
        region: get(r, 'region', 'Region'),
        state: get(r, 'state', 'State'),
        city: get(r, 'city', 'City'),
        // [CHANGE #2] Read Master Segment from Customer sheet if it exists
        masterSegment: get(r, 'Master_Segment', 'Master Segment'),
        products: [],
      });
    });
    // 2. Products
    sheet('Products').forEach((r: any) => {
      const cid = get(r, 'customerId', 'Customer ID');
      const cust = custMap.get(String(cid));
      if (!cust) return;
      cust.products.push({
        category: get(r, 'category', 'Category'),
        sku: get(r, 'sku', 'SKU'),
      });
    });
    setCustomers(Array.from(custMap.values()));
    // 3. Transactions
    const tx = sheet('Transactions').map((r: any) => ({
      customerId: String(get(r, 'customerId', 'Customer ID')),
      category: get(r, 'category', 'Category'),
      sku: get(r, 'sku', 'SKU'),
      width: get(r, 'width', 'Width') ? Number(get(r, 'width', 'Width')) : null,
      thickness: get(r, 'thickness', 'Thickness')
        ? Number(get(r, 'thickness', 'Thickness'))
        : null,
      region: get(r, 'region', 'Region'),
      state: get(r, 'state', 'State'),
      city: get(r, 'city', 'City'),
      dealPrice: Number(get(r, 'dealPrice', 'Deal Price') || 0),
      marketIndex: Number(get(r, 'marketIndex', 'Market Index') || 0),
      qty: Number(get(r, 'qty', 'Quantity') || 0),
      date: get(r, 'date', 'Date'),
      segmentNode: get(r, 'Segment__node'), // Added from your file
    }));
    setTxns(tx.sort((a, b) => (a.date < b.date ? 1 : -1)));
    // 4. Market Index
    const idx = {};
    sheet('MarketIndex').forEach((r: any) => {
      const key = `${get(r, 'region', 'Region')}|${get(r, 'category')}`;
      if (!idx[key]) idx[key] = [];
      idx[key].push({
        date: get(r, 'date', 'Date'),
        index: Number(get(r, 'index', 'Index') || 0),
      });
    });
    Object.values(idx).forEach((arr: any) =>
      arr.sort((a, b) => (a.date < b.date ? -1 : 1)),
    );
    setMarketIndex(idx);
    // 5. Segments
    const segs = sheet('Segments').map((r: any) => ({
      key: get(r, 'key', 'Key'),
      minPrice: Number(get(r, 'minPrice', 'Min Price') || 0),
      maxPrice: Number(get(r, 'maxPrice', 'Max Price') || 0),
      totalQty: Number(get(r, 'totalQty', 'Total Qty') || 0),
    }));
    setSegments(segs);
    // 6. Customer Monthly (optional)
    const cm = sheet('CustomerMonthly').map((r: any) => ({
      customerId: String(get(r, 'customerId', 'Customer ID')),
      customerName: get(r, 'customerName', 'Customer Name'),
      category: get(r, 'category', 'Category'),
      sku: get(r, 'sku', 'SKU'),
      month: String(get(r, 'month', 'Month')),
      realizedPrice: Number(get(r, 'realizedPrice', 'Realized Price') || 0),
      qty: Number(get(r, 'qty', 'Quantity') || 0),
      region: get(r, 'region', 'Region'),
      state: get(r, 'state', 'State'),
      city: get(r, 'city', 'City'),
      endUseIndustry: get(r, 'endUseIndustry', 'End Use Industry'),
      // [CHANGE #2] Read Master Segment from Monthly sheet if it exists
      masterSegment: get(r, 'Master_Segment', 'Master Segment'),
    }));
    if (cm.length) setCustomerMonthly(cm);
    // 7. Raw Rows (optional, for behavior)
    const rr = sheet('RawData');
    if (rr.length) setRawRows(rr);
    // 8. Descriptions (optional)
    const desc = sheet('Descriptions');
    if (desc.length) {
      const map = {};
      desc.forEach((r: any) => {
        const SKU = get(r, 'SKU', 'sku', 'SO-JSW Grade');
        const node = get(r, 'Segment__node', 'Segment Node');
        const d = get(
          r,
          'Segment_Description',
          'Segment Description',
        );
        if (SKU && node !== undefined && node !== null && d) {
          map[`${String(SKU)}|${String(node)}`] = String(d);
        }
      });
      setSegDescMap(map);
    }
  }

  /* ====== Modal logic ====== */
  function handlePriceClick(segKey) {
    if (!segKey || !rawRows.length) {
      setRangeRows([]);
      setRangeOpen(false);
      return;
    }
    const [sku, node] = segKey.split('|');
    let rows = rawRows.filter(
      (r) =>
        String(rget(r, 'SKU')) === sku &&
        String(rget(r, 'Segment__node')) === node,
    );
    if (rangeFYOnly) {
      rows = rows.filter((r) =>
        String(rget(r, 'Month', 'date')).startsWith('2024'),
      );
    }
    const prices = rows
      .map((r) =>
        Number(rget(r, 'Current Price (INR per MT)', 'dealPrice') || 0),
      )
      .filter((p) => p > 0)
      .sort((a, b) => a - b);
    if (rangeExcludeOutliers && prices.length > 10) {
      const q1 = prices[Math.floor(prices.length * 0.25)];
      const q3 = prices[Math.floor(prices.length * 0.75)];
      const iqr = q3 - q1;
      const min = q1 - 1.5 * iqr;
      const max = q3 + 1.5 * iqr;
      rows = rows.filter((r) => {
        const p = Number(
          rget(r, 'Current Price (INR per MT)', 'dealPrice') || 0,
        );
        return p >= min && p <= max;
      });
    }
    // Map to txn format
    const tx = rows.map((r) => ({
      customerId: rget(r, 'Customer Name', 'Ship to Party Name', 'cust'),
      category: 'HRC',
      sku,
      width: null,
      thickness: null,
      region: rget(r, 'Region'),
      state: rget(r, 'State'),
      city: rget(r, 'Ship To City'),
      dealPrice: Number(rget(r, 'Current Price (INR per MT)', 'dealPrice') || 0),
      marketIndex: Number(
        rget(r, 'Market Index - Monthly_Average_Price') || 0,
      ),
      qty: Number(rget(r, 'quantity (MT)') || 0),
      date: String(rget(r, 'Month', 'date')),
      segmentNode: node,
    }));
    setRangeRows(tx.sort((a, b) => (a.date < b.date ? 1 : -1)));
    setRangeOpen(true);
  }
  /* ============= RENDER ============== */
  return (
    <div
      className="flex min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style jsx global>{`
        /* [NO CHANGE] This is the original style block */
        :root {
          --brand: #0f172a;
          --brand-accent: #e11d48;
          --brand-ink: #0f172a;
        }
      `}</style>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      {/* Main content */}
      <div
        className={`relative w-full min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'pl-64' : 'pl-20'
        }`}
        style={{ background: JSW_COLORS.light }}
      >
        <div className="flex-1 p-4 sm:p-6 lg:p-10 space-y-6 max-w-[1800px] mx-auto">
          {/* Header bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                className="text-slate-600 hover:text-slate-900"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1
                className="text-xl md:text-2xl font-semibold"
                style={{ color: JSW_COLORS.ink }}
              >
                Customer Price Guidance
              </h1>
            </div>
            {/* Top-right actions */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm px-3 py-2 cursor-pointer hover:bg-slate-50">
                Upload Data (XLSX/CSV)
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx"
                  onChange={handleDataUpload}
                />
              </label>
              <label className="text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm px-3 py-2 cursor-pointer hover:bg-slate-50">
                Upload Segments (Desc)
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx"
                  onChange={handleDescUpload}
                />
              </label>
              <label className="text-xs font-medium text-white border rounded-lg shadow-sm px-3 py-2 cursor-pointer" style={{backgroundColor: 'var(--brand)', borderColor: 'var(--brand-dark)'}}>
                Upload Full Workbook
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx"
                  onChange={handleFullUpload}
                />
              </label>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <FilterSelect
                label="Customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                options={customers.map((c) => [c.id, c.name])}
              />
              <FilterSelect
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoriesForCustomer}
              />
              <FilterSelect
                label="SKU"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                options={skusForCategory}
              />
              <FilterSelect
                label="Node"
                value={segmentNode}
                onChange={(e) => setSegmentNode(e.target.value)}
                options={eligibleNodes}
              />
              <FilterSelect
                label="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                options={regions}
              />
              <FilterSelect
                label="State"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                options={statesForRegion}
              />
              <FilterSelect
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                options={citiesForState}
              />
              <FilterInput
                label="Qty (MT)"
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* [NO CHANGE] Original 2-column grid */}
            
            {/* Col 1 */}
            <div className="space-y-6">
              <SectionCard title="Customer Profile">
                <CustomerInfo customer={selectedCustomer} />
              </SectionCard>

              {/* [CHANGE #3] NEW CARD MOVED HERE (Col 1) */}
              <SectionCard title="Master Segment">
                <p className="text-xl font-semibold text-slate-800">
                  {masterSegment}
                </p>
              </SectionCard>
              {/* === END OF NEW CARD === */}

              <SectionCard
                title="Segment Price Range"
                right={`Node: ${segmentNode}`}
              >
                <SegmentPriceRange
                  min={seg?.minPrice}
                  max={seg?.maxPrice}
                  onClick={() => handlePriceClick(segKey)}
                />
              </SectionCard>
              <SectionCard
                title="Segment Description"
                right={`Total Qty (FY25): ${fmtInt(seg?.totalQty)} MT`}
              >
                <p className="text-slate-800">{segDesc}</p>
              </SectionCard>
            </div>

            {/* Col 2 */}
            <div className="space-y-6">
              {/* [CHANGE #3] Card was REMOVED from here */}
              <SectionCard
                title="Customer Behavior Profile"
                right={
                  lastTxnForNode
                    ? `Last purchase (node): ${lastTxnForNode.date} @ ${INR(
                        lastTxnForNode.dealPrice,
                      )}`
                    : 'No purchase in node'
                }
                subtitle={oneLiner}
              >
                <div className="flex flex-wrap gap-2">
                  {behaviorChips.map(([label, value]) => badge(label, value))}
                </div>
              </SectionCard>
              <SectionCard
                title="Price History (Customer vs. Market)"
                bodyClassName="h-96"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="date"
                      dy={10}
                      tick={{ fontSize: 11, fill: '#475569' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickFormatter={fmtInt}
                    />
                    <Tooltip
                      formatter={(v) => INR(v)}
                      labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
                      itemStyle={{ fontSize: 12 }}
                      contentStyle={{
                        borderRadius: '12px',
                        borderColor: '#e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="index"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      name="Market Index"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cust"
                      stroke={'var(--brand-accent)'}
                      strokeWidth={2}
                      name="Customer Price"
                      connectNulls
                      dot={{ r: 3, fill: 'var(--brand-accent)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* Bottom Row: Table */}
            <div className="lg:col-span-2">
              <SectionCard
                title="Recent Transactions (SKU)"
                bodyClassName="h-96 overflow-y-auto"
              >
                <TransactionTable txns={recentTxns} />
              </SectionCard>
            </div>
          </div>

          <Modal
            title={`Deep Dive: ${segKey}`}
            open={rangeOpen}
            onClose={() => setRangeOpen(false)}
            footer={
              <>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={rangeFYOnly}
                      onChange={(e) => setRangeFYOnly(e.target.checked)}
                    />
                    FY25 Only
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={rangeExcludeOutliers}
                      onChange={(e) =>
                        setRangeExcludeOutliers(e.target.checked)
                      }
                    />
                    Exclude Outliers
                  </label>
                </div>
                <span className="text-sm text-slate-600">
                  Showing {rangeRows.length} deals
                </span>
              </>
            }
          >
            <TransactionTable txns={rangeRows} />
          </Modal>
        </div>
      </div>
    </div>
  );
}

/* ============== SUB-COMPONENTS ============= */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <select
        className="w-full text-sm bg-white border border-slate-300 rounded-lg shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={onChange}
      >
        {options.map((opt) => {
          const [val, display] = Array.isArray(opt) ? opt : [opt, opt];
          return (
            <option key={val} value={val}>
              {display}
            </option>
          );
        })}
      </select>
    </div>
  );
}
function FilterInput({ label, value, onChange, ...props }) {
  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        className="w-full text-sm bg-white border border-slate-300 rounded-lg shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}

function CustomerInfo({ customer }) {
  if (!customer) return null;
  const fields = [
    ['Name', customer.name],
    ['Region', customer.region],
    ['State', customer.state],
    ['City', customer.city],
  ];
  return (
    <div className="space-y-2">
      {fields.map(([label, value]) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-slate-600">{label}:</span>
          <span className="font-semibold text-slate-800">{value || '—'}</span>
        </div>
      ))}
    </div>
  );
}

function SegmentPriceRange({ min, max, onClick }) {
  return (
    <div
      className="group rounded-xl p-4 cursor-pointer relative transition-all"
      onClick={onClick}
      style={{
        background:
          'linear-gradient(145deg, hsl(228, 66%, 98%), hsl(228, 66%, 95%))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            Guidance Range
          </div>
          <div
            className="text-3xl font-bold my-1"
            style={{ color: 'var(--brand-accent)' }}
          >
            {INR(min)} – {INR(max)}
          </div>
        </div>
        <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function TransactionTable({ txns }) {
  return (
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50">
        <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {[
            'Date',
            'Deal Price',
            'Market Index',
            'Δ vs Index',
            'Qty (MT)',
            'W x T (mm)',
            'Location',
          ].map((h) => (
            <th key={h} className="px-3 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-200">
        {txns.map((t, idx) => {
          const delta =
            Number.isFinite(t.dealPrice) && Number.isFinite(t.marketIndex)
              ? t.dealPrice - t.marketIndex
              : null;
          return (
            <tr key={idx} className="border-b hover:bg-slate-50">
              <td className="px-3 py-2">{t.date}</td>
              <td className="px-3 py-2 font-semibold">{INR(t.dealPrice)}</td>
              <td className="px-3 py-2">{INR(t.marketIndex)}</td>
              <td
                className={`px-3 py-2 ${
                  delta === null
                    ? ''
                    : delta >= 0
                    ? 'text-green-700'
                    : 'text-red-700'
                } font-semibold`}
              >
                {delta === null
                  ? '—'
                  : `${delta >= 0 ? '+' : ''}${fmtInt(delta)}`}
              </td>
              <td className="px-3 py-2">{fmtInt(t.qty)}</td>
              <td className="px-3 py-2">
                {t.width || '—'} x {t.thickness || '—'}
              </td>
              <td className="px-3 py-2">{t.city || t.state || '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}