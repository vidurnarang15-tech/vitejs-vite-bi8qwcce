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
const rget = (row: any, ...names: string[]) => {
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

/* ============= SAMPLE (boot) ============== */
let SAMPLE = {
  customers: [
    {
      id: 'C001',
      name: 'Agrawal Steel Traders',
      region: 'West',
      state: 'Maharashtra',
      city: 'Mumbai',
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
      products: [{ category: 'TMT', sku: 'Fe550D' }],
    },
    {
      id: 'C003',
      name: 'Khyati Steel Corporation Group',
      region: 'West',
      state: 'Gujarat',
      city: 'Ahmedabad',
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

/* =============== UI PRIMITIVES ============== */
function SectionCard({
  title,
  children,
  right,
  className = '',
  bodyClassName = '',
}) {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 border text-slate-600">
            {/* simple list icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </span>
          <h3
            className="text-base md:text-lg font-semibold truncate"
            style={{ color: JSW_COLORS.primary }}
          >
            {title}
          </h3>
        </div>
        <div className="text-xs text-slate-500 break-words">{right}</div>
      </div>
      <div className={`p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

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
          <button onClick={onClose} className="btn-ghost">
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

/* =========== Sidebar (UPDATED) =========== */
function Sidebar({ open, setOpen }) {
  const logoUrl = '/logo.png';

  const NavIcon = ({ children }) => (
    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
      {children}
    </div>
  );

  // ✔ PNG rupee icon with white filter
  const RupeeIcon = (
    <img
      src="/rupee-icon.png"
      alt="Rupee"
      className="h-6 w-6 object-contain invert brightness-0"
      draggable={false}
    />
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

  const NavItem = ({ icon, text, active = false }) => (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer text-slate-200 hover:bg-white/10`}
      style={active ? { background: 'rgba(26,44,107,0.25)' } : {}}
    >
      <NavIcon>{icon}</NavIcon>
      {open && <span className="font-medium">{text}</span>}
    </div>
  );

  return (
    <div
      className={`fixed top-0 left-0 h-full text-white p-4 transition-all duration-300 z-30 ${
        open ? 'w-64' : 'w-20'
      }`}
      style={{ background: 'var(--brand)' }}
    >
      <div className="flex flex-col h-full">
        {/* Logo only (no text), now filtered white */}
        <div className="flex items-center h-12 mb-6">
          <img
            src={logoUrl}
            alt="Logo"
            className={`h-10 invert brightness-0 ${open ? 'mx-0' : 'mx-auto'}`}
            draggable={false}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          <NavItem icon={RupeeIcon} text="Customer Pricing" active />
        </nav>

        {/* Toggle */}
        <div className="mt-auto">
          <div
            className="flex items-center gap-4 p-3 rounded-lg cursor-pointer text-slate-300 hover:bg-white/10"
            onClick={() => setOpen(!open)}
          >
            <NavIcon>{MenuIcon}</NavIcon>
            {open && <span className="font-medium">Collapse</span>}
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
  const [customerMonthly, setCustomerMonthly] = useState<any[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [segDescMap, setSegDescMap] = useState<Record<string, string>>({});

  // Deep-dive modal state
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeRows, setRangeRows] = useState<any[]>([]);
  const [rangeFYOnly, setRangeFYOnly] = useState(true);
  const [rangeExcludeOutliers, setRangeExcludeOutliers] = useState(true);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // UI state
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || customers[0],
    [customers, customerId]
  );

  const categoriesForCustomer = useMemo(
    () =>
      Array.from(
        new Set((selectedCustomer?.products || []).map((p) => p.category))
      ),
    [selectedCustomer]
  );
  const [category, setCategory] = useState(categoriesForCustomer[0] || 'HRC');

  const skusForCategory = useMemo(
    () =>
      (selectedCustomer?.products || [])
        .filter((p) => p.category === category)
        .map((p) => p.sku),
    [selectedCustomer, category]
  );
  const [sku, setSku] = useState(skusForCategory[0] || '');

  const widths = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku
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
          t.sku === sku
      )
      .map((t) => t.thickness)
      .filter((v) => v != null);
    return Array.from(new Set(pool));
  }, [txns, customerId, category, sku]);
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [qty, setQty] = useState(100);

  const regions = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku
      )
      .map((t) => t.region)
      .filter(Boolean);
    const fallback = customers.map((c) => c.region).filter(Boolean);
    return Array.from(new Set(pool.length ? pool : fallback));
  }, [txns, customers, customerId, category, sku]);
  const [region, setRegion] = useState(
    selectedCustomer?.region || regions[0] || ''
  );
  const statesForRegion = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku &&
          (!region || t.region === region)
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
    selectedCustomer?.state || statesForRegion[0] || ''
  );
  const citiesForState = useMemo(() => {
    const pool = (txns || [])
      .filter(
        (t) =>
          t.customerId === customerId &&
          t.category === category &&
          t.sku === sku &&
          (!region || t.region === region) &&
          (!stateName || t.state === stateName)
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
    selectedCustomer?.city || citiesForState[0] || ''
  );

  useEffect(() => {
    setCustomerId(customers[0]?.id || '');
  }, [customers]);
  useEffect(() => {
    setCategory(categoriesForCustomer[0] || 'HRC');
  }, [categoriesForCustomer]);
  useEffect(() => {
    setSku(skusForCategory[0] || '');
  }, [skusForCategory]);
  useEffect(() => {
    setWidth(widths.length ? String(widths[0]) : '');
    setThickness(thicknesses.length ? String(thicknesses[0]) : '');
  }, [sku, widths, thicknesses]);
  useEffect(() => {
    setRegion(selectedCustomer?.region || regions[0] || '');
  }, [selectedCustomer, regions]);
  useEffect(() => {
    setStateName(selectedCustomer?.state || statesForRegion[0] || '');
  }, [selectedCustomer, statesForRegion]);
  useEffect(() => {
    setCity(selectedCustomer?.city || citiesForState[0] || '');
  }, [selectedCustomer, citiesForState]);

  const [segmentNode, setSegmentNode] = useState<string>('');
  const eligibleNodes = useMemo(() => {
    const rows = (rawRows || []).filter(
      (r) =>
        String(r['SKU']) === sku &&
        String(r['Customer Name'] || r['Ship to Party Name'] || r['cust']) ===
          selectedCustomer?.name
    );
    const nodes = Array.from(
      new Set(rows.map((r) => r['Segment__node']).filter((v) => v != null))
    );
    return nodes.sort((a: any, b: any) => Number(a) - Number(b));
  }, [rawRows, sku, selectedCustomer]);
  useEffect(() => {
    setSegmentNode(eligibleNodes[0] ?? '');
  }, [eligibleNodes]);

  const segKey = useMemo(
    () => (segmentNode ? `${sku}|${segmentNode}` : null),
    [sku, segmentNode]
  );
  const seg = useMemo(
    () => (segKey ? (segments || []).find((s) => s.key === segKey) : null),
    [segments, segKey]
  );
  const segDesc = segKey ? segDescMap[segKey] || '—' : '—';

  const recentTxns = useMemo(
    () =>
      (txns || [])
        .filter(
          (t) =>
            t.customerId === customerId &&
            t.category === category &&
            t.sku === sku
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 10),
    [txns, customerId, category, sku]
  );
  const lastTxnForNode = useMemo(
    () =>
      (txns || [])
        .filter(
          (t) =>
            t.customerId === customerId &&
            t.category === category &&
            t.sku === sku &&
            String(t.segmentNode) === String(segmentNode)
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0],
    [txns, customerId, category, sku, segmentNode]
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
          r.sku === sku
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
          t.sku === sku
      ),
    [txns, customerId, category, sku]
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

  const mode = (arr: any[]) => {
    const m = new Map();
    arr.forEach((v) => m.set(v, (m.get(v) || 0) + 1));
    let best: any = null,
      cnt = -1;
    m.forEach((c, v) => {
      if (c > cnt) {
        cnt = c;
        best = v;
      }
    });
    return best;
  };
  const lakhs = (n: any) =>
    n == null || isNaN(Number(n))
      ? '—'
      : `₹${Math.round(Number(n) / 100000).toLocaleString()} L`;

  function computeBehaviorChips() {
    const rows = (rawRows || []).filter(
      (r) =>
        String(rget(r, 'Customer Name', 'Ship to Party Name', 'cust')) ===
          selectedCustomer?.name && String(rget(r, 'SKU')) === sku
    );
    const pick = (c: string) =>
      rows.map((r) => rget(r, c)).filter((x) => x !== undefined && x !== null);

    const monthsRaw = Array.from(
      new Set(pick('Month').map((v) => String(v).slice(0, 7)))
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
        r.sku === sku
    );
    const rRows = (rawRows || []).filter(
      (r) =>
        String(rget(r, 'Customer Name', 'Ship to Party Name', 'cust')) ===
          selectedCustomer?.name && String(rget(r, 'SKU')) === sku
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
      monYY(String(ym).slice(0, 7) + '-01')
    );
    const topMonths = Array.from(monthToQty.entries())
      .sort((a: any, b: any) => b[1] - a[1])
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
      const m = { H: 'High', M: 'Medium', L: 'Low' } as any;
      if (!qbin) return 'Medium';
      const up = String(qbin).trim().toUpperCase();
      return (m[up] || qbin) as string;
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
    [rawRows, selectedCustomer, sku]
  );
  const oneLiner = useMemo(
    () => computeOneLiner(),
    [rawRows, customerMonthly, selectedCustomer, sku, category]
  );

  /* ============ Upload handlers (unchanged) ============ */
  async function handleDescUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    const assignMap = (arr: any[]) => {
      const map: Record<string, string> = {};
      arr.forEach((r) => {
        const SKU = rget(r, 'SKU', 'sku', 'Sku', 'SO-JSW Grade');
        const node = rget(
          r,
          'Segment__node',
          'segment__node',
          'Segment Node',
          'Segment_Node'
        );
        const desc = rget(
          r,
          'Segment_Description',
          'SegmentDescription',
          'Description',
          'Segment Description'
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
        complete: ({ data }) => assignMap(data || []),
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(new Uint8Array(evt.target!.result as ArrayBuffer), {
        type: 'array',
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      assignMap(rows as any[]);
    };
    reader.readAsArrayBuffer(f);
  }

  async function handleDataUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();

    if (name.endsWith('.csv')) {
      const Papa = (await import('papaparse')).default;
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          const rows: any[] = data || [];
          const hasMonthly =
            rows[0] && rget(rows[0], 'month', 'Month', 'YYYY-MM');
          if (hasMonthly) {
            const cm = rows.map((r) => ({
              customerId: rget(r, 'customerId', 'CustomerId', 'Customer ID'),
              customerName: rget(
                r,
                'customerName',
                'CustomerName',
                'Customer Name'
              ),
              category: rget(r, 'category', 'Category') || 'HRC',
              sku: rget(r, 'sku', 'SKU'),
              month: String(rget(r, 'month', 'Month', 'YYYY-MM')),
              realizedPrice: Number(
                rget(r, 'realizedPrice', 'RealizedPrice', 'realized_price') || 0
              ),
              qty: Number(rget(r, 'qty', 'quantity', 'Quantity') || 0),
              region: rget(r, 'region', 'Region'),
              state: rget(r, 'state', 'State'),
              city: rget(r, 'city', 'City'),
              endUseIndustry: rget(
                r,
                'endUseIndustry',
                'industry',
                'end use industry'
              ),
            }));
            setCustomerMonthly(cm);
            const idx: any = {};
            cm.forEach((r) => {
              const k = `All|${r.category || 'HRC'}`;
              if (!idx[k]) idx[k] = [];
              if (!idx[k].some((x: any) => x.date === r.month))
                idx[k].push({ date: r.month, index: r.realizedPrice });
            });
            if (Object.keys(idx).length)
              setMarketIndex((prev) =>
                Object.keys(prev || {}).length ? prev : idx
              );
            return;
          }
          const custMap = new Map();
          const tx: any[] = [];
          rows.forEach((r, i) => {
            const cid =
              rget(
                r,
                'customerId',
                'customer_id',
                'CustomerId',
                'CustomerID',
                'Customer'
              ) || `U_${i}`;
            const nm =
              rget(
                r,
                'customerName',
                'customer',
                'CustomerName',
                'Customer Name'
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
                'Product Category'
              ) || 'HRC'
            ).toString();
            const sku = (
              rget(r, 'sku', 'SKU', 'SO-JSW Grade', 'SKU') || ''
            ).toString();
            if (!custMap.has(cid))
              custMap.set(cid, {
                id: cid,
                name: nm,
                region,
                state,
                city,
                products: [{ category, sku }],
              });
            const dealPrice = Number(
              rget(
                r,
                'dealPrice',
                'price',
                'Deal Price',
                'Actual NSR Per MT'
              ) || 0
            );
            const marketIdx = Number(
              rget(r, 'marketIndex', 'index', 'Market Index', 'Market') || 0
            );
            const width = rget(r, 'width', 'Width')
              ? Number(rget(r, 'width', 'Width'))
              : null;
            const thickness = rget(r, 'thickness', 'Thickness')
              ? Number(rget(r, 'thickness', 'Thickness'))
              : null;
            const qty = Number(
              rget(r, 'qty', 'quantity', 'Quantity', 'Actual Sales Qty') || 0
            );
            const date = (
              rget(r, 'date', 'Date', 'Txn Date', 'SO Date') || ''
            ).toString();
            tx.push({
              customerId: cid,
              category,
              sku,
              width,
              thickness,
              region,
              state,
              city,
              dealPrice,
              marketIndex: marketIdx,
              qty,
              date,
            });
          });
          setTxns(tx.sort((a, b) => (a.date < b.date ? 1 : -1)));
          setCustomers(Array.from(custMap.values()) as any);
        },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const XLSX = await import('xlsx');
      const data = new Uint8Array(evt.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      const get = rget;
      const custMap = new Map();
      const monthSeries: any[] = [];
      const idxByMonth = new Map();
      const segAgg = new Map(); // SKU|Segment__node -> prices
      const tx: any[] = [];
      const segDescFromFile: Record<string, string> = {};

      rows.forEach((r, i) => {
        const customerName =
          get(r, 'Customer Name', 'Ship to Party Name', 'cust') || `U_${i}`;
        const cid = customerName;
        const sku = get(r, 'SKU');
        const category = 'HRC';
        const month = String(get(r, 'Month') || '');
        const region = get(r, 'Region') || '';
        const state = get(r, 'State') || '';
        const city = get(r, 'Ship To City') || '';
        const qty = Number(get(r, 'quantity (MT)') || 0);
        const price = Number(get(r, 'Current Price (INR per MT)') || 0);
        const mi = Number(get(r, 'Market Index - Monthly_Average_Price') || 0);
        const segNode = get(r, 'Segment__node');
        const isOutlier = Boolean(get(r, '__is_outlier'));
        const endUseIndustry = get(
          r,
          'endUseIndustry',
          'EndUseIndustry',
          'End Use Industry',
          'end use industry',
          'Industry'
        );
        const width = Number(get(r, 'SO Width (mm)', 'Width (mm)', 'width'));
        const thickness = Number(
          get(
            r,
            'SO_Thickness (mm)',
            'SO Thickness (mm)',
            'Thickness (mm)',
            'thickness'
          )
        );
        const segDescription = get(
          r,
          'Segment_Description',
          'Segment Description',
          'Seg_Desc',
          'Description'
        );

        if (!custMap.has(cid))
          custMap.set(cid, {
            id: cid,
            name: customerName,
            region,
            state,
            city,
            products: [{ category, sku }],
          });

        if (month && sku && price) {
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
            endUseIndustry,
          });
        }
        if (month && mi) idxByMonth.set(month, mi);

        if (sku && segNode !== undefined && segNode !== null) {
          const key = `${sku}|${segNode}`;
          if (!segAgg.has(key)) segAgg.set(key, []);
          if (!isOutlier && price) (segAgg.get(key) as number[]).push(price);
          if (segDescription) segDescFromFile[key] = String(segDescription);
        }

        if (sku)
          tx.push({
            customerId: cid,
            category,
            sku,
            width,
            thickness,
            region,
            state,
            city,
            dealPrice: price,
            marketIndex: mi,
            qty,
            date: month,
            segmentNode: segNode,
          });
      });

      setRawRows(rows);
      setCustomers(Array.from(custMap.values()) as any);
      setCustomerMonthly(monthSeries);
      setTxns(tx.sort((a, b) => (a.date < b.date ? 1 : -1)));
      setMarketIndex({
        [`All|HRC`]: Array.from(idxByMonth.entries())
          .sort((a: any, b: any) => (a[0] < b[0] ? -1 : 1))
          .map(([date, index]) => ({ date, index })),
      });
      const segs = Array.from(segAgg.entries()).map(([key, arr]: any) => {
        const sorted = arr.slice().sort((a: number, b: number) => a - b);
        const median = sorted.length
          ? sorted[Math.floor(sorted.length / 2)]
          : undefined;
        const min = sorted.length ? sorted[0] : undefined;
        const max = sorted.length ? sorted[sorted.length - 1] : undefined;
        return { key, name: key, priceRange: [min, max], median };
      });
      setSegments(segs);
      if (Object.keys(segDescFromFile).length)
        setSegDescMap((prev) => ({ ...prev, ...segDescFromFile }));
    };
    reader.readAsArrayBuffer(f);
  }

  const openRangeDeepDive = () => {
    if (!seg || !seg.priceRange) return;
    const [minP, maxP] = seg.priceRange.map(Number);
    const rows = (rawRows || [])
      .filter((r) => {
        const rSku = rget(r, 'SKU');
        const rNode = rget(r, 'Segment__node');
        const price = Number(
          rget(
            r,
            'Current Price (INR per MT)',
            'Actual NSR Per MT',
            'Deal Price'
          ) || 0
        );
        const isOutlier = Boolean(rget(r, '__is_outlier'));
        if (rSku?.toString() !== sku?.toString()) return false;
        if (String(rNode) !== String(segmentNode)) return false;
        if (!Number.isFinite(price)) return false;
        if (rangeExcludeOutliers && isOutlier) return false;
        if (!(price >= minP && price <= maxP)) return false;
        if (rangeFYOnly) {
          const ym = String(rget(r, 'Month') || '').slice(0, 7);
          if (ym < '2024-04' || ym > '2025-03') return false;
        }
        return true;
      })
      .map((r) => {
        const ym = String(rget(r, 'Month') || '').slice(0, 7);
        const deal = Number(
          rget(
            r,
            'Current Price (INR per MT)',
            'Actual NSR Per MT',
            'Deal Price'
          ) || 0
        );
        const idx = Number(
          rget(
            r,
            'Market Index - Monthly_Average_Price',
            'Market Index',
            'Market'
          ) || 0
        );
        const delta =
          Number.isFinite(idx) && idx !== 0 ? Math.round(deal - idx) : null;
        return {
          date: monYY(ym + '-01'),
          customer: String(
            rget(r, 'Customer Name', 'Ship to Party Name', 'cust') || '—'
          ),
          industry:
            rget(r, 'endUseIndustry', 'Industry', 'End Use Industry') || '—',
          dealPrice: deal,
          marketIndex: Number.isFinite(idx) ? idx : null,
          delta,
          qty: Number(
            rget(r, 'quantity (MT)', 'Quantity', 'Actual Sales Qty') || 0
          ),
          width: rget(r, 'SO Width (mm)', 'Width (mm)', 'width') ?? '—',
          thickness:
            rget(
              r,
              'SO_Thickness (mm)',
              'SO Thickness (mm)',
              'Thickness (mm)',
              'thickness'
            ) ?? '—',
          region: rget(r, 'Region') || '—',
          state: rget(r, 'State') || '—',
          city: rget(r, 'Ship To City', 'City') || '—',
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    setRangeRows(rows);
    setRangeOpen(true);
  };

  const downloadRangeCSV = () => {
    if (!rangeRows.length) return;
    const headers = [
      'Date',
      'Customer',
      'Industry',
      'Deal Price (₹/MT)',
      'Market Index (₹/MT)',
      'Δ vs Index',
      'Qty (MT)',
      'Width (mm)',
      'Thickness (mm)',
      'Region',
      'State',
      'City',
    ];
    const lines = [headers.join(',')].concat(
      rangeRows.map((r) =>
        [
          r.date,
          r.customer,
          r.industry,
          r.dealPrice,
          r.marketIndex ?? '',
          r.delta ?? '',
          r.qty,
          r.width,
          r.thickness,
          r.region,
          r.state,
          r.city,
        ]
          .map((v) =>
            v === null || v === undefined ? '' : String(v).replace(/"/g, '""')
          )
          .map((v) => (/[,\n]/.test(v) ? `"${v}"` : v))
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `range_deep_dive_${sku}_node_${segmentNode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    try {
      console.assert(Array.isArray(behaviorChips), 'Behavior chips ready');
      const _idx =
        marketIndex[`${region}|${category}`] ||
        marketIndex[`All|${category}`] ||
        [];
      if (!_idx.length)
        console.warn('No index series found (ok with fresh uploads).');
    } catch (e) {
      console.warn('Smoke tests warning:', e);
    }
  }, [behaviorChips, marketIndex, region, category]);

  /* ================== RENDER ================== */
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1
            className="text-2xl font-semibold"
            style={{ color: JSW_COLORS.primary }}
          >
            Customer Pricing
          </h1>
          <div className="hidden sm:flex items-center gap-3 ml-auto">
            <div className="badge border-slate-300 text-slate-600">
              Date{' '}
              <span className="ml-1 font-semibold">
                {new Date().toISOString().slice(0, 10)}
              </span>
            </div>
            <div className="badge border-slate-300 text-slate-600">
              Environment <span className="ml-1 font-semibold">Demo</span>
            </div>
          </div>
        </div>

        {/* Header card: Customer + Uploads */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Select
              label="Customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={customers.map((c) => [c.id, c.name])}
              wrapperClassName="w-full sm:w-auto sm:min-w-[300px] sm:max-w-xs"
            />
            <div className="flex items-center gap-3 ml-auto">
              <input
                id="dataInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleDataUpload}
                className="hidden"
              />
              <label
                htmlFor="dataInput"
                className="btn-ghost"
                style={{ color: JSW_COLORS.primary }}
              >
                Upload Excel/CSV
              </label>

              <input
                id="descInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleDescUpload}
                className="hidden"
              />
              <label
                htmlFor="descInput"
                className="btn-ghost"
                style={{ color: JSW_COLORS.primary }}
              >
                Upload Descriptions
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Median Price"
              value={INR(seg?.median)}
              color="blue"
              help={`SKU: ${sku} | Node: ${segmentNode || 'N/A'}`}
            />
            <StatCard
              label="Segment Price Range"
              value={`${INR(seg?.priceRange?.[0])} – ${INR(
                seg?.priceRange?.[1]
              )}`}
              color="green"
              help="Min – Max (non-outlier)"
              onClick={openRangeDeepDive}
            />
            <StatCard
              label="Last Txn Price & Quantity"
              value={INR(lastTxnForNode?.dealPrice)}
              color="red"
              help={`Qty: ${fmtInt(lastTxnForNode?.qty)} MT | On: ${
                lastTxnForNode?.date || 'N/A'
              }`}
            />
          </div>

          <SectionCard
            title="Price Simulation Parameters"
            right={`Customer: ${selectedCustomer?.name || '...'}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-4">
                <Select
                  label="Product Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={categoriesForCustomer}
                />
                <Select
                  label="Product SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  options={skusForCategory}
                />
                <Select
                  label="Micro-Segment (Node)"
                  value={segmentNode}
                  onChange={(e) => setSegmentNode(e.target.value)}
                  options={eligibleNodes}
                />
              </div>

              <div className="space-y-4">
                <Select
                  label="Region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  options={regions}
                />
                <Select
                  label="State"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  options={statesForRegion}
                />
                <Select
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  options={citiesForState}
                />
              </div>

              <div className="space-y-4">
                <Select
                  label="Width (mm)"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  options={widths.map(String)}
                  optional
                />
                <Select
                  label="Thickness (mm)"
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  options={thicknesses.map(String)}
                  optional
                />
                <Input
                  label="Quantity (MT)"
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Segment Description"
            right={`Node: ${segmentNode || 'N/A'}`}
          >
            <p
              className="text-sm leading-relaxed"
              style={{ color: JSW_COLORS.ink }}
            >
              {segDesc}
            </p>
          </SectionCard>

          <SectionCard title="Customer Behavior Profile">
            {/* Move the description (oneLiner) to its own line */}
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {oneLiner}
            </p>

            {/* Behavior chips grid */}
            <div className="flex flex-wrap gap-3">
              {behaviorChips.map(([label, value]) => (
                <div
                  key={label}
                  className="flex-shrink-0 bg-white rounded-xl px-4 py-2 border shadow-sm"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {label}
                  </div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: 'var(--brand)' }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Price History (vs Market Index)"
            bodyClassName="h-96"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedSeries}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" style={{ fontSize: 12 }} />
                <YAxis
                  width={60}
                  style={{ fontSize: 12 }}
                  tickFormatter={(v) => `₹${Math.round((v as number) / 1000)}k`}
                />
                <Tooltip formatter={(value, name) => [INR(value), name]} />
                <Line
                  type="monotone"
                  dataKey="index"
                  name="Market Index"
                  stroke={JSW_COLORS.primary}
                  strokeOpacity={0.6}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cust"
                  name="Customer Price"
                  stroke={JSW_COLORS.ink}
                  strokeWidth={2}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Recent Transactions (Last 10 for this SKU)">
            <TxnTable txns={recentTxns} />
          </SectionCard>
        </div>
      </main>

      {/* Deep Dive Modal */}
      <Modal
        title={`Deep Dive: ${sku} | Node ${segmentNode}`}
        open={rangeOpen}
        onClose={() => setRangeOpen(false)}
        footer={
          <>
            <div className="flex gap-4">
              <Checkbox
                label="FY 2024-25 Only"
                checked={rangeFYOnly}
                onChange={(e) => setRangeFYOnly(e.target.checked)}
              />
              <Checkbox
                label="Exclude Outliers"
                checked={rangeExcludeOutliers}
                onChange={(e) => setRangeExcludeOutliers(e.target.checked)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={openRangeDeepDive} className="btn-ghost">
                Refresh
              </button>
              <button onClick={downloadRangeCSV} className="btn-primary">
                Download CSV
              </button>
            </div>
          </>
        }
      >
        <p className="mb-4 text-sm text-slate-600">
          Showing {rangeRows.length} transactions within the segment's
          non-outlier price range of {INR(seg?.priceRange?.[0])} –{' '}
          {INR(seg?.priceRange?.[1])}.
        </p>
        <div className="w-full overflow-x-auto border rounded-lg">
          <table className="table min-w-[1200px]">
            <thead>
              <tr>
                {[
                  'Date',
                  'Customer',
                  'Industry',
                  'Deal Price',
                  'Index',
                  'Δ vs Index',
                  'Qty (MT)',
                  'Width',
                  'Thickness',
                  'Region',
                  'State',
                  'City',
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rangeRows.map((r, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td>{r.date}</td>
                  <td className="font-medium">{r.customer}</td>
                  <td>{r.industry}</td>
                  <td className="font-semibold">{INR(r.dealPrice)}</td>
                  <td>{INR(r.marketIndex)}</td>
                  <td
                    className={`${
                      Number(r.delta) >= 0 ? 'text-green-700' : 'text-red-700'
                    } font-semibold`}
                  >
                    {r.delta == null
                      ? '—'
                      : `${r.delta >= 0 ? '+' : ''}${fmtInt(r.delta)}`}
                  </td>
                  <td>{fmtInt(r.qty)}</td>
                  <td>{r.width}</td>
                  <td>{r.thickness}</td>
                  <td>{r.region}</td>
                  <td>{r.state}</td>
                  <td>{r.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

/* ======= Form & misc components (styled) ======= */
function Select({
  label,
  value,
  onChange,
  options,
  optional = false,
  wrapperClassName = '',
}) {
  return (
    <label className={`block w-full ${wrapperClassName}`}>
      <span className="text-xs text-slate-600">{label}</span>
      <select value={value || ''} onChange={onChange} className="select mt-1">
        <option value="">{optional ? 'All' : 'Select...'}</option>
        {(options || []).map((opt: any) => {
          const [val, display] = Array.isArray(opt) ? opt : [opt, opt];
          return (
            <option key={val} value={val}>
              {display || val}
            </option>
          );
        })}
      </select>
    </label>
  );
}
function Input({ label, type, value, onChange }) {
  return (
    <label className="block w-full">
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="input mt-1"
      />
    </label>
  );
}
function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-slate-300 text-blue-600 shadow-sm focus:ring-blue-500"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
function StatCard({ label, value, color, help, onClick }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    green: 'text-green-700 bg-green-50 border-green-200',
    red: 'text-red-700 bg-red-50 border-red-200',
  };
  const pill = colorMap[color] || 'text-slate-700 bg-slate-50 border-slate-200';
  return (
    <div
      className={`card ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className={`badge border ${pill}`}>{label}</div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 border text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12M6 12h12"
              />
            </svg>
          </span>
        </div>
        <div
          className="text-3xl font-extrabold mt-3"
          style={{ color: JSW_COLORS.primary }}
        >
          {value}
        </div>
        <div className="text-xs text-slate-500 mt-1">{help || '\u00A0'}</div>
      </div>
    </div>
  );
}
function TxnTable({ txns = [] }) {
  if (!txns.length)
    return (
      <p className="text-slate-500">
        No recent transactions found for this selection.
      </p>
    );
  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <table className="table min-w-[800px]">
        <thead>
          <tr>
            {[
              'Date',
              'Deal Price',
              'Market Index',
              'Δ vs Index',
              'Qty (MT)',
              'W x T (mm)',
              'Location',
            ].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {txns.map((t, idx) => {
            const delta =
              Number.isFinite(t.dealPrice) && Number.isFinite(t.marketIndex)
                ? t.dealPrice - t.marketIndex
                : null;
            return (
              <tr key={idx} className="border-b hover:bg-slate-50">
                <td>{t.date}</td>
                <td className="font-semibold">{INR(t.dealPrice)}</td>
                <td>{INR(t.marketIndex)}</td>
                <td
                  className={`${
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
                <td>{fmtInt(t.qty)}</td>
                <td>
                  {t.width || '—'} x {t.thickness || '—'}
                </td>
                <td>{t.city || t.state || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
