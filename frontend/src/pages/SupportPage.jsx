/**
 * SupportPage — FAQ accordion and WhatsApp contact link (loaded from settings).
 */
import { useState, useEffect } from "react";
import { ChevronDown, MessageCircle, HelpCircle } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How do I start earning USDT?",
    a: "After creating your account, go to the Task Center from your dashboard. Browse available tasks and click 'Start Task' to view the instructions. Complete the task as described, then submit for review. Once approved by our team your wallet balance is credited automatically.",
  },
  {
    q: "What is the minimum withdrawal amount?",
    a: "The minimum withdrawal amount is set by the platform admin and is displayed on your Withdrawal page. Typically it is $10 USDT. You must have at least that amount in your wallet before you can request a withdrawal.",
  },
  {
    q: "How long do withdrawals take to process?",
    a: "Withdrawal requests are reviewed by our admin team. Most requests are processed within 24 hours. You will see the status update in your Withdrawal History once it has been reviewed. Approved withdrawals are sent directly to the TRC20 wallet address you provided.",
  },
  {
    q: "What is a VIP level and how do I upgrade?",
    a: "VIP levels unlock higher-reward tasks and increase your daily earning limits. You can upgrade by making a qualifying deposit. Visit the VIP Upgrade page to see each tier's requirements, then contact us on WhatsApp to initiate the upgrade process.",
  },
  {
    q: "Why was my withdrawal rejected?",
    a: "Withdrawals can be rejected for reasons such as an invalid wallet address, suspicious activity, or insufficient verification. The rejection note (if provided) will be shown in your Withdrawal History. Contact support on WhatsApp if you believe it was rejected in error.",
  },
  {
    q: "How does the referral program work?",
    a: "Every account has a unique referral code visible on your Profile page. Share it with friends — when they register using your code you may receive a bonus (amount depends on current platform promotions). Referral bonuses appear in your transaction history.",
  },
  {
    q: "Is my wallet balance safe?",
    a: "Yes. Your wallet balance is stored securely and is only modified by approved task completions, admin adjustments, or your own withdrawal requests. We use JWT authentication and follow security best practices to protect your account.",
  },
  {
    q: "What payment method do you support for withdrawals?",
    a: "We currently support USDT withdrawals via the TRC20 network (Tron). Make sure to provide your TRC20-compatible wallet address. Sending to the wrong network will result in permanent loss of funds — we cannot recover funds sent to wrong network addresses.",
  },
];

// ─── Accordion item ───────────────────────────────────────────────────────────

function AccordionItem({ question, answer, open, onToggle }) {
  return (
    <div className="border-b theme-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-(--bg-card-hover) transition-colors cursor-pointer"
      >
        <span className="text-sm font-medium theme-text">{question}</span>
        <ChevronDown
          className={`w-4 h-4 theme-text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="px-6 pb-4 text-sm theme-text-secondary leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [openIndex,     setOpenIndex]     = useState(null);
  const [whatsappLink,  setWhatsappLink]  = useState("");

  useEffect(() => {
    axiosInstance.get("/wallet/public/settings/")
      .then((r) => setWhatsappLink(r.data.whatsapp_link || ""))
      .catch(() => {});
  }, []);

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center animate-fade-in-up">
        <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-7 h-7 text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold theme-text mb-2">Support Center</h1>
        <p className="theme-text-secondary text-sm">
          Find answers to common questions below, or reach us directly on WhatsApp.
        </p>
      </div>

      {/* ── WhatsApp CTA ───────────────────────────────────────────────── */}
      {whatsappLink && (
        <div
          className="card rounded-2xl p-5 flex items-center gap-4 animate-fade-in-up"
          style={{ animationDelay: "50ms" }}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold theme-text">Need direct help?</p>
            <p className="text-xs theme-text-muted mt-0.5">
              Our support team typically replies within a few minutes.
            </p>
          </div>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>
      )}

      {/* ── FAQ accordion ──────────────────────────────────────────────── */}
      <div
        className="card rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="px-6 py-4 border-b theme-border">
          <h2 className="text-base font-semibold theme-text">Frequently Asked Questions</h2>
        </div>
        {FAQS.map((faq, i) => (
          <AccordionItem
            key={i}
            question={faq.q}
            answer={faq.a}
            open={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <p className="text-center text-xs theme-text-muted animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        Can't find your answer?{" "}
        {whatsappLink ? (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 transition-colors">
            Contact us on WhatsApp
          </a>
        ) : (
          <span>Contact our support team.</span>
        )}
      </p>
    </div>
  );
}
