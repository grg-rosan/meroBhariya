// src/pages/landing/LandingPage.jsx
import { Link } from "react-router-dom";

// ── 3-Color system ─────────────────────────────────────────────────────────
// Primary:   #1E40AF  (blue-800)   — trust, reliability
// Accent:    #F97316  (orange-500) — action, speed
// Base:      #111827  (gray-900)   — professional dark base

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-orange-400 font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">meroBhariya</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#features"     className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#faq"          className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Start shipping
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-blue-800 rounded-full"></span>
            Kathmandu's trusted delivery partner
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Every package.{" "}
            <span className="text-blue-800">Delivered.</span>{" "}
            <span className="text-orange-500">Insured.</span>
          </h1>

          {/* H2 */}
          <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-xl">
            We don't do everything — we master one thing. Fast, reliable last-mile
            delivery with full insurance coverage for every shipment.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/register/merchant"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Start shipping now →
            </Link>
            <Link
              to="/register/rider"
              className="border border-gray-200 hover:border-gray-400 text-gray-700 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Become a rider
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mt-14 flex flex-wrap gap-8">
            {[
              { value: "10,000+", label: "Packages monthly" },
              { value: "99.7%",   label: "On-time rate" },
              { value: "रू 50L+", label: "Insurance covered" },
              { value: "500+",    label: "Businesses served" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE HOOK ────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-4">The problem</p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-6">
              Most couriers promise everything. <br />
              <span className="text-gray-400">Then deliver nothing.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Missed pickups. Lost packages. Zero accountability. Your local business
              suffers when your delivery partner treats your orders as just another
              number in a pile.
            </p>
          </div>
          <div>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Our answer</p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-6">
              One service. <br />
              <span className="text-orange-400">Done perfectly.</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              meroBhariya is built for Kathmandu's local businesses and logistics
              centres. We handle last-mile delivery — and only that — so every
              package gets our full attention, backed by real insurance.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="mb-14">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl font-bold text-gray-900">Built for reliability</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "🛡",
              title: "Full package insurance",
              feature: "Every shipment is insured from pickup to delivery.",
              benefit: "So what? You never lose money on a damaged or lost package. File a claim and get reimbursed — no arguments.",
              color: "bg-blue-50 text-blue-800",
            },
            {
              icon: "📍",
              title: "Real-time GPS tracking",
              feature: "Live rider location visible to you and your customer.",
              benefit: "So what? No more 'where is my package?' calls. Your customers stay informed automatically.",
              color: "bg-orange-50 text-orange-700",
            },
            {
              icon: "⏱",
              title: "Guaranteed delivery windows",
              feature: "We commit to same-day or next-day slots and keep them.",
              benefit: "So what? Your customers get a delivery promise they can trust — and so do you.",
              color: "bg-gray-100 text-gray-700",
            },
          ].map(f => (
            <div key={f.title} className="border border-gray-100 rounded-2xl p-7 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base mb-5 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{f.feature}</p>
              <div className="border-t border-dashed border-gray-100 pt-4">
                <p className="text-xs text-gray-400 leading-relaxed">{f.benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-gray-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-3xl font-bold text-gray-900">Up and running in minutes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Book a shipment", desc: "Enter pickup and delivery details from your merchant dashboard. We calculate fare instantly." },
              { step: "02", title: "We pick it up", desc: "A verified rider arrives at your location within the committed window. Package is scanned and insured on pickup." },
              { step: "03", title: "Delivered & confirmed", desc: "Customer receives the package. You get a delivery confirmation with proof. COD settled directly." },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="text-4xl font-bold text-orange-500 mb-5 leading-none">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="mb-14">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-3">Trust</p>
          <h2 className="text-3xl font-bold text-gray-900">Businesses that rely on us</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "We switched from three different couriers to just meroBhariya. Our delivery complaints dropped to zero.",
              name:  "Sanjay Maharjan",
              biz:   "New Road Electronics, Kathmandu",
            },
            {
              quote: "The insurance alone made it worth it. One damaged item claim was settled within 24 hours.",
              name:  "Priya Shrestha",
              biz:   "Thamel Organic Store",
            },
            {
              quote: "Our riders are always on time. The dispatcher dashboard is clean and we can track everything live.",
              name:  "Bikram Rai",
              biz:   "Patan Hub Logistics",
            },
          ].map(t => (
            <div key={t.name} className="border border-gray-100 rounded-2xl p-7">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-orange-400 text-xs">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">"{t.quote}"</p>
              <div className="border-t border-gray-50 pt-4">
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.biz}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-gray-50 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900">Common questions</h2>
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {[
              {
                q: "How does the insurance work?",
                a: "Every shipment is automatically insured from the moment a rider scans your package at pickup. If a package is lost or damaged, file a claim through your dashboard and we process reimbursement within 48 hours — up to the declared order value.",
              },
              {
                q: "Is it more expensive than regular couriers?",
                a: "Our fares are calculated transparently based on distance, weight, and vehicle type — no hidden fees. When you factor in zero losses from damaged goods and the time saved chasing other couriers, most businesses save money overall.",
              },
              {
                q: "Can I integrate with my existing order management system?",
                a: "Yes. We provide a REST API so your store or logistics software can create shipments programmatically. Get your API key from the merchant dashboard and start integrating in minutes.",
              },
              {
                q: "What areas do you cover?",
                a: "We currently operate across the Kathmandu Valley — Kathmandu, Lalitpur, and Bhaktapur. Expansion to other cities is planned for 2025.",
              },
            ].map(f => (
              <details key={f.q} className="group py-5 cursor-pointer list-none">
                <summary className="flex justify-between items-center text-sm font-semibold text-gray-900 select-none list-none">
                  {f.q}
                  <span className="text-gray-300 group-open:text-orange-500 text-lg transition-colors ml-4 flex-shrink-0">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="bg-blue-800 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Ready to ship with confidence?
          </h2>
          <p className="text-blue-200 mb-10 leading-relaxed">
            Join 500+ Kathmandu businesses who trust meroBhariya with their deliveries.
            No setup fees. No contracts. Cancel anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register/merchant"
              className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              Start shipping now — it's free
            </Link>
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-blue-300 text-xs">
            No credit card required · No setup fee · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-orange-400 font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-white text-sm">meroBhariya</span>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} meroBhariya. Kathmandu, Nepal.
          </p>
          <div className="flex gap-6 text-xs text-gray-600">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}