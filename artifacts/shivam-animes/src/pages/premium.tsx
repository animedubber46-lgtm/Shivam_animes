import Navbar from "@/components/Navbar";
import { Crown, Check, Send } from "lucide-react";

const plans = [
  { label: "15 Days", price: "₹10", days: 15, features: ["Full episode access", "HD quality", "Mobile + Desktop", "1 device"] },
  { label: "1 Month", price: "₹19", days: 30, features: ["Full episode access", "HD quality", "Mobile + Desktop", "1 device", "Best value"] },
];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <Crown size={48} className="text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white mb-3">Buy Premium Access</h1>
          <p className="text-muted-foreground">Unlock unlimited anime episodes. Pay once, enjoy instantly.</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {plans.map((plan) => (
            <div key={plan.label} className="glass-panel rounded-2xl p-6 border border-yellow-500/20 neon-glow-cyan" data-testid={`plan-${plan.days}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{plan.label}</h2>
                {plan.days === 30 && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">Best Value</span>
                )}
              </div>
              <p className="text-4xl font-black text-yellow-400 mb-6">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-green-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* QR Section */}
        <div className="glass-panel rounded-2xl p-8 border border-yellow-500/20 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Pay via QR Code</h2>
          <p className="text-muted-foreground text-sm mb-6">Scan the QR code to pay, then contact us on Telegram with your payment screenshot.</p>

          <div className="flex justify-center mb-6">
            <div className="rounded-xl overflow-hidden border-2 border-yellow-500/30 p-2 bg-white inline-block">
              <img
                src="https://ibb.co/NnL17w3t"
                alt="Payment QR Code"
                className="w-40 h-40 object-contain"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = "none";
                  el.parentElement!.innerHTML = `<div class="w-40 h-40 flex items-center justify-center bg-yellow-50 text-yellow-700 text-xs p-4 text-center">QR Code<br/>Scan to Pay<br/>UPI Available</div>`;
                }}
                data-testid="img-qr"
              />
            </div>
          </div>

          <a
            href="https://t.me/A_Gatherers_isekai_In_Hindi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3 bg-[#2CA5E0] hover:bg-[#229bd6] rounded-xl font-semibold text-white transition-all neon-glow-cyan"
            data-testid="btn-telegram"
          >
            <Send size={18} />
            Contact on Telegram for Premium
          </a>

          <p className="text-xs text-muted-foreground mt-4">
            After payment, contact us with your screenshot. Premium is activated within minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
