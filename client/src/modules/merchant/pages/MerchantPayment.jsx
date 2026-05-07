import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    quota: 10,
    overage: null,
    features: ["10 shipments/mo", "Zone-based fare", "Wallet top-up", "Basic tracking"],
    popular: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: 799,
    quota: 50,
    overage: 30,
    features: ["50 shipments/mo", "NPR 30/extra shipment", "Overage allowed", "Email alerts"],
    popular: false,
  },
  {
    id: "standard",
    name: "Standard",
    price: 1999,
    quota: 150,
    overage: 25,
    features: ["150 shipments/mo", "NPR 25/extra shipment", "COD support", "Express delivery"],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 4499,
    quota: 500,
    overage: 20,
    features: ["500 shipments/mo", "NPR 20/extra shipment", "Priority assignment", "Invoice PDF"],
    popular: false,
  },
];

const TRANSACTIONS = [
  { id: 1, type: "TOPUP",      note: "eSewa top-up verified",                   date: "May 03", amount: 5000  },
  { id: 2, type: "DEDUCTION",  note: "Shipment #A4821 · Zone 2",                date: "May 03", amount: -100  },
  { id: 3, type: "DEDUCTION",  note: "Shipment #A4822 · COD + Zone 3",          date: "May 04", amount: -165  },
  { id: 4, type: "REFUND",     note: "Shipment #A4819 cancelled before pickup", date: "May 04", amount: 150   },
  { id: 5, type: "ADJUSTMENT", note: "Admin promo credit · May campaign",        date: "May 05", amount: 500   },
  { id: 6, type: "DEDUCTION",  note: "Shipment #A4831 · Express · Zone 1",      date: "May 05", amount: -90   },
];

const GATE_STEPS = [
  { n: 1, check: "Has active subscription?",                                              fail: "No → 403",         pass: false },
  { n: 2, check: "Within monthly quota?",                                                 fail: "Yes → proceed",    pass: true  },
  { n: 3, check: "Over quota — plan allows overage?",                                     fail: "No → 402 upgrade", pass: false },
  { n: 4, check: "Wallet ≥ overage rate?",                                                fail: "No → 402 top up",  pass: false },
  { n: 5, check: "Wallet ≥ fare amount?",                                                 fail: "No → 402 top up",  pass: false },
  { n: 6, check: "All clear → fare preview → merchant confirms → deduct wallet",          fail: "Shipment created", pass: true  },
];

const STANDARD_FLOW = [
  { actor: "M", title: "Merchant tops up wallet",   desc: "eSewa / Khalti → webhook verified → credited",   tag: "+NPR (amount)",  credit: true  },
  { actor: "M", title: "Shipment confirmed",         desc: "Zone 2 · 8km · Standard",                       tag: "−NPR 100",       credit: false },
  { actor: "D", title: "Dispatcher assigns rider",   desc: "Rider → ON_DELIVERY",                           tag: null,             credit: null  },
  { actor: "R", title: "Rider delivers → DELIVERED", desc: "Earning fires immediately on status change",     tag: "+NPR 75",        credit: true  },
  { actor: "S", title: "Platform margin",            desc: "75% rider · 25% platform",                      tag: "NPR 25 revenue", credit: null  },
  { actor: "A", title: "Rider requests payout",      desc: "Admin confirms transfer → balance deducted",    tag: "−NPR 75",        credit: false },
];

const COD_FLOW = [
  { actor: "M", title: "COD shipment confirmed",         desc: "Fare NPR 100 + COD fee NPR 15",              tag: "−NPR 115",       credit: false },
  { actor: "R", title: "Rider delivers → collects cash", desc: "NPR 2,000 collected from customer",          tag: "COD_COLLECTED",  credit: null  },
  { actor: "D", title: "Rider hands cash to dispatcher", desc: "Dispatcher confirms in system",              tag: "COD_REMITTED",   credit: null  },
  { actor: "A", title: "Admin reconciles batch",         desc: "Releases full COD amount to merchant",       tag: "+NPR 2,000",     credit: true  },
  { actor: "R", title: "Rider earning credited",         desc: "75% of fare + COD bonus on top",             tag: "+NPR 86.25 +20", credit: true  },
];

const COD_STAGES = [
  { label: "MERCHANT",   status: "done",   name: "Created"    },
  { label: "RIDER",      status: "done",   name: "Collected"  },
  { label: "DISPATCHER", status: "active", name: "Remitted"   },
  { label: "ADMIN",      status: "idle",   name: "Reconciled" },
];

const ZONES = [
  { label: "Zone 1 · 0–5km",   base: 60  },
  { label: "Zone 2 · 5–15km",  base: 100 },
  { label: "Zone 3 · 15–30km", base: 150 },
  { label: "Zone 4 · 30km+",   base: 200 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ACTOR_COLORS = {
  M: { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200" },
  R: { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  D: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  A: { bg: "bg-red-50",    text: "text-red-800",    border: "border-red-200"    },
  S: { bg: "bg-teal-50",   text: "text-teal-800",   border: "border-teal-200"   },
};

const TX_BADGE = {
  TOPUP:      "bg-teal-50 text-teal-800",
  DEDUCTION:  "bg-red-50 text-red-800",
  REFUND:     "bg-violet-50 text-violet-800",
  ADJUSTMENT: "bg-amber-50 text-amber-800",
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[10px] tracking-widest text-stone-400 mb-3 uppercase">
      {children}
    </p>
  );
}

function PlanCard({ plan, current = "standard" }) {
  const isActive = plan.id === current;
  return (
    <div
      className={`relative rounded-xl p-5 flex flex-col gap-3 transition-all duration-150
        ${isActive
          ? "border-2 border-amber-400 bg-white"
          : "border border-stone-200 bg-white hover:shadow-md"}`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-mono tracking-wider px-3 py-1 rounded-sm whitespace-nowrap">
          POPULAR
        </span>
      )}
      <div>
        <p className="font-mono text-[10px] tracking-widest text-stone-400 mb-1">{plan.name.toUpperCase()}</p>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-3xl text-stone-900">
            {plan.price === 0 ? "Free" : plan.price.toLocaleString()}
          </span>
          {plan.price > 0 && <span className="text-xs text-stone-400">NPR/mo</span>}
        </div>
      </div>
      <hr className="border-stone-100" />
      <div>
        <p className="text-sm font-medium text-stone-800">{plan.quota} shipments/mo</p>
        <p className="font-mono text-[11px] text-stone-400 mt-0.5">
          {plan.overage ? `NPR ${plan.overage}/extra` : "No overage — upgrade required"}
        </p>
      </div>
      <ul className="flex flex-col gap-1.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-stone-500">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        className={`w-full mt-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-120
          ${isActive
            ? "bg-stone-900 text-white"
            : "bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900"}`}
      >
        {isActive ? "Current plan" : "Upgrade"}
      </button>
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-stone-50 rounded-lg p-4">
      <p className="text-[11px] text-stone-400 mb-1">{label}</p>
      <p className="font-serif text-2xl text-stone-900 leading-none">{value}</p>
      {sub && <p className="font-mono text-[11px] text-stone-500 mt-1">{sub}</p>}
    </div>
  );
}

function FlowStep({ step, isLast }) {
  const c = ACTOR_COLORS[step.actor];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-medium border ${c.bg} ${c.text} ${c.border}`}>
          {step.actor}
        </div>
        {!isLast && <div className="w-px flex-1 bg-stone-200 my-0.5" />}
      </div>
      <div className="pb-4">
        <p className="text-[13px] font-medium text-stone-800 leading-tight">{step.title}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{step.desc}</p>
        {step.tag && (
          <span className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded mt-1.5
            ${step.credit === true  ? "bg-teal-50 text-teal-800"
            : step.credit === false ? "bg-red-50 text-red-700"
            :                         "bg-stone-100 text-stone-500"}`}>
            {step.tag}
          </span>
        )}
      </div>
    </div>
  );
}

function GateRow({ step }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100 last:border-0 text-[12px]">
      <div className="w-5 h-5 rounded-full border border-stone-200 flex items-center justify-center font-mono text-[10px] text-stone-400 shrink-0">
        {step.n}
      </div>
      <p className="flex-1 text-stone-700">{step.check}</p>
      <span className={`font-mono text-[10px] px-2 py-0.5 rounded whitespace-nowrap shrink-0
        ${step.pass ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"}`}>
        {step.fail}
      </span>
    </div>
  );
}

function FareEstimator() {
  const [zoneIdx, setZoneIdx] = useState(1);
  const [cod, setCod] = useState(false);
  const [express, setExpress] = useState(false);
  const [heavy, setHeavy] = useState(false);

  let fare = ZONES[zoneIdx].base;
  const parts = [`base NPR ${fare}`];
  if (heavy)   { fare += 20;                    parts.push("+20 weight");   }
  if (cod)     { fare += 15;                    parts.push("+15 COD");      }
  if (express) { fare = Math.round(fare * 1.5); parts.push("×1.5 express"); }
  const riderEarn = Math.round(fare * 0.75);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-stone-400 mb-2">ZONE</p>
          <select
            value={zoneIdx}
            onChange={(e) => setZoneIdx(Number(e.target.value))}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 text-stone-800 focus:outline-none"
          >
            {ZONES.map((z, i) => (
              <option key={i} value={i}>{z.label} (NPR {z.base})</option>
            ))}
          </select>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-widest text-stone-400 mb-2">OPTIONS</p>
          <div className="flex flex-col gap-2">
            {[
              { label: "COD collection (+NPR 15)", val: cod,     set: setCod     },
              { label: "Express ×1.5 multiplier",  val: express, set: setExpress },
              { label: "Weight >5kg (+NPR 20)",     val: heavy,   set: setHeavy   },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() => set(!val)}
                  className="rounded border-stone-300 accent-amber-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-widest text-stone-400 mb-2">FARE PREVIEW</p>
          <div className="bg-stone-50 border border-stone-100 rounded-lg p-4">
            <p className="font-serif text-3xl text-stone-900 leading-none">NPR {fare}</p>
            <p className="font-mono text-[10px] text-stone-400 mt-1">{parts.join(" · ")}</p>
            <p className="text-[11px] text-teal-700 mt-2">
              Rider earns: <span className="font-medium">NPR {riderEarn}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodTracker() {
  const stageStyle = {
    done:   "bg-teal-50 border-teal-200 text-teal-800",
    active: "bg-amber-50 border-amber-300 text-amber-800",
    idle:   "bg-stone-50 border-stone-200 text-stone-400",
  };
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center overflow-x-auto pb-1">
        {COD_STAGES.map((s, i) => (
          <div key={s.label} className="flex items-center shrink-0">
            <div className={`border rounded-lg px-4 py-2.5 text-center ${stageStyle[s.status]}`}>
              <p className="font-mono text-[9px] tracking-widest mb-0.5">{s.label}</p>
              <p className="font-medium text-[12px]">{s.name}</p>
            </div>
            {i < COD_STAGES.length - 1 && (
              <div className="w-6 border-t border-dashed border-stone-300 shrink-0 mx-[-1px]" />
            )}
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-stone-400 mt-3">
        Current status:{" "}
        <span className="text-amber-700 font-medium">REMITTED</span>
        {" "}· Awaiting admin batch reconciliation
      </p>
    </div>
  );
}

function TxTable() {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-stone-100">
            {["TYPE", "NOTE", "DATE", "AMOUNT"].map((h) => (
              <th key={h} className="text-left font-mono text-[10px] tracking-widest text-stone-400 px-4 py-3 font-normal last:text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TRANSACTIONS.map((tx) => (
            <tr key={tx.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors last:border-0">
              <td className="px-4 py-3">
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${TX_BADGE[tx.type]}`}>
                  {tx.type}
                </span>
              </td>
              <td className="px-4 py-3 text-stone-500">{tx.note}</td>
              <td className="px-4 py-3 text-stone-400 font-mono">{tx.date}</td>
              <td className={`px-4 py-3 font-mono font-medium text-right ${tx.amount > 0 ? "text-teal-700" : "text-red-600"}`}>
                {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function MeroBhariyaDashboard() {
  const [activeTab, setActiveTab] = useState("plans");

  const tabs = [
    { id: "plans",  label: "Plans"      },
    { id: "wallet", label: "Wallet"     },
    { id: "flow",   label: "Money Flow" },
    { id: "cod",    label: "COD"        },
  ];

  return (
    <div className="min-h-screen bg-stone-100 font-sans">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-stone-200 px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-stone-900 text-white font-mono text-[10px] tracking-widest px-2.5 py-1 rounded-sm">
              meroBhariya
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-mono text-[10px] text-stone-400 tracking-wider">MERCHANT PORTAL</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal">
            Subscription & Finance
          </h1>
          <p className="text-sm text-stone-400 mt-1">Manage your plan, wallet, and delivery finances</p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white border-b border-stone-200 px-4">
        <div className="max-w-5xl mx-auto flex gap-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 font-mono text-[11px] tracking-wider border-b-2 transition-colors
                ${activeTab === t.id
                  ? "border-amber-500 text-stone-900"
                  : "border-transparent text-stone-400 hover:text-stone-600"}`}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* PLANS TAB */}
        {activeTab === "plans" && (
          <div className="flex flex-col gap-6">
            <SectionLabel>Subscription tiers</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLANS.map((p) => <PlanCard key={p.id} plan={p} current="standard" />)}
            </div>

            <div>
              <SectionLabel>Shipment creation gate — middleware order</SectionLabel>
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <p className="font-serif text-lg text-stone-900 font-normal">Access control checks</p>
                  <p className="text-xs text-stone-400 mt-0.5">Runs in this exact order on every shipment creation request</p>
                </div>
                {GATE_STEPS.map((s) => <GateRow key={s.n} step={s} />)}
              </div>
            </div>

            <div>
              <SectionLabel>Fare estimator</SectionLabel>
              <FareEstimator />
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === "wallet" && (
          <div className="flex flex-col gap-6">
            <div>
              <SectionLabel>Wallet overview · Demo merchant</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Wallet balance"  value="8,240"    sub="NPR available"      />
                <MetricCard label="Shipments used"  value="34 / 150" sub="Standard quota"     />
                <MetricCard label="Period ends"     value="Jun 01"   sub="resets on 1st"      />
                <MetricCard label="COD pending"     value="3"        sub="awaiting reconcile" />
              </div>
            </div>

            <div>
              <SectionLabel>Recent wallet transactions</SectionLabel>
              <TxTable />
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <SectionLabel>Top up wallet</SectionLabel>
              <div className="flex flex-col sm:flex-row gap-3">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    className="flex-1 border border-stone-200 rounded-lg py-3 text-sm font-medium text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
                  >
                    NPR {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-3">
                {["eSewa", "Khalti"].map((m) => (
                  <button
                    key={m}
                    className="px-5 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Pay via {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MONEY FLOW TAB */}
        {activeTab === "flow" && (
          <div className="flex flex-col gap-6">
            <SectionLabel>Platform money flow</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <p className="font-serif text-lg text-stone-900 mb-4 font-normal">Standard delivery</p>
                {STANDARD_FLOW.map((s, i) => (
                  <FlowStep key={i} step={s} isLast={i === STANDARD_FLOW.length - 1} />
                ))}
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <p className="font-serif text-lg text-stone-900 mb-4 font-normal">COD delivery</p>
                {COD_FLOW.map((s, i) => (
                  <FlowStep key={i} step={s} isLast={i === COD_FLOW.length - 1} />
                ))}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <p className="font-mono text-[10px] tracking-widest text-stone-400 mb-3">ACTOR LEGEND</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries({ M: "Merchant", R: "Rider", D: "Dispatcher", A: "Admin", S: "System" }).map(([k, v]) => {
                  const c = ACTOR_COLORS[k];
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border ${c.bg} ${c.text} ${c.border}`}>{k}</div>
                      <span className="text-xs text-stone-500">{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* COD TAB */}
        {activeTab === "cod" && (
          <div className="flex flex-col gap-6">
            <div>
              <SectionLabel>COD status tracker</SectionLabel>
              <CodTracker />
            </div>

            <div>
              <SectionLabel>COD responsibility matrix</SectionLabel>
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="text-left font-mono text-[10px] tracking-widest text-stone-400 px-4 py-3 font-normal">STEP</th>
                      <th className="text-left font-mono text-[10px] tracking-widest text-stone-400 px-4 py-3 font-normal">WHO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Mark shipment as COD",             "Merchant",   "M"],
                      ["Collect cash from customer",       "Rider",      "R"],
                      ["Mark COD_COLLECTED in app",        "Rider",      "R"],
                      ["Receive physical cash from rider", "Dispatcher", "D"],
                      ["Confirm COD_REMITTED in system",   "Dispatcher", "D"],
                      ["Reconcile and release to merchant","Admin",      "A"],
                    ].map(([step, who, actor]) => {
                      const c = ACTOR_COLORS[actor];
                      return (
                        <tr key={step} className="border-b border-stone-50 hover:bg-stone-50 last:border-0">
                          <td className="px-4 py-3 text-stone-600">{step}</td>
                          <td className="px-4 py-3">
                            <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>
                              {who}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <p className="font-serif text-base text-stone-900 mb-3 font-normal">COD business rules</p>
                <ul className="flex flex-col gap-2">
                  {[
                    "Rider must mark COD_COLLECTED before shipment can be DELIVERED",
                    "Dispatcher must confirm REMITTED before Admin can reconcile",
                    "Merchant never receives COD cash directly — platform intermediates",
                    "Failed COD → return shipment → no payout → no platform fee",
                    "COD fee (NPR 15) charged to merchant, not deducted from rider",
                    "Rider COD bonus (NPR 20) is in addition to regular earning",
                  ].map((r) => (
                    <li key={r} className="flex items-start gap-2 text-xs text-stone-500">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <p className="font-serif text-base text-stone-900 mb-3 font-normal">COD example calculation</p>
                <div className="flex flex-col gap-1 font-mono text-[11px]">
                  {[
                    ["COD amount (customer pays)",     "NPR 2,000",  "neutral"],
                    ["Shipment fare (Zone 2)",          "NPR 100",    "neutral"],
                    ["COD fee charged to merchant",     "NPR 15",     "debit"  ],
                    ["Total merchant wallet deducted",  "NPR 115",    "debit"  ],
                    ["Merchant receives (COD payout)",  "NPR 2,000",  "credit" ],
                    ["Rider fare cut (75%)",            "NPR 86.25",  "credit" ],
                    ["Rider COD bonus",                 "NPR 20",     "credit" ],
                    ["Rider total earning",             "NPR 106.25", "credit" ],
                  ].map(([label, val, type]) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-stone-50 last:border-0">
                      <span className="text-stone-500">{label}</span>
                      <span className={
                        type === "credit" ? "text-teal-700 font-medium" :
                        type === "debit"  ? "text-red-600 font-medium"  :
                        "text-stone-600"
                      }>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}