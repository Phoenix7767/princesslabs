"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to /auth if not logged in
    getCurrentUser().then((user) => {
      if (!user) window.location.href = "/auth";
      else setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] leading-tight">
              Custom Cosplay
              <br />
              <span className="text-[var(--pink-primary)]">Weapons</span>
            </h1>

            {/* Subtext */}
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Premium quality toy pistols and snipers for cosplay enthusiasts.
              Handcrafted with attention to detail for the ultimate roleplay
              experience.
            </p>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[var(--pink-primary)] hover:bg-[var(--pink-secondary)] text-white font-bold py-4 px-8 rounded-full text-lg md:text-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Shop Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Precision Crafted
              </h3>
              <p className="text-[var(--text-secondary)]">
                Each weapon is meticulously crafted with premium materials for
                authentic look and feel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Fast Shipping
              </h3>
              <p className="text-[var(--text-secondary)]">
                Get your custom cosplay weapon delivered to your door in 3-5
                business days.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Safe & Legal
              </h3>
              <p className="text-[var(--text-secondary)]">
                All our toys are clearly marked and comply with safety
                regulations for cosplay use.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Our Collection
            </h2>
            <p className="text-[var(--text-secondary)] text-lg">
              Choose from our range of custom cosplay weapons
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pistols */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-[var(--bg-secondary)] p-8 rounded-lg text-center"
            >
              <div className="text-6xl mb-4">🔫</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Custom Pistols
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                From classic revolvers to futuristic blasters, our pistols are
                perfect for any cosplay.
              </p>
              <button className="bg-[var(--pink-primary)] hover:bg-[var(--pink-secondary)] text-white font-medium py-2 px-6 rounded-full transition-colors">
                View Pistols
              </button>
            </motion.div>

            {/* Snipers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="bg-[var(--bg-secondary)] p-8 rounded-lg text-center"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Precision Snipers
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                Long-range rifles with incredible detail and realistic features
                for serious cosplayers.
              </p>
              <button className="bg-[var(--pink-primary)] hover:bg-[var(--pink-secondary)] text-white font-medium py-2 px-6 rounded-full transition-colors">
                View Snipers
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 bg-[var(--bg-tertiary)] text-center">
        <p className="text-[var(--text-secondary)]">
          © 2069 Cosplay Weapons. All toys are for cosplay purposes only.
          Phoenix is gay!
        </p>
      </footer>
    </div>
  );
}
