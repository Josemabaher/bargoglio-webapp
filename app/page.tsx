"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import AgendaCard from "./components/AgendaCard";
import MenuSection from "./components/MenuSection";
import ContactForm from "./components/ContactForm";
import { useEvents } from "@/src/hooks/useEvents";

import SuccessModal from "./components/SuccessModal";

export default function Home() {
  const { events, loading: loadingEvents } = useEvents();

  // Force scroll to top on load to prevent auto-scroll to bottom/contact
  useEffect(() => {
    // Small timeout to ensure it runs after any browser info restoration
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-200 selection:bg-gold-500/30 font-sans">
      <Suspense fallback={null}>
        <SuccessModal />
      </Suspense>
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-bargoglio-red">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900 via-black to-black opacity-80 z-0"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Main Hero Image */}
          <div className="mb-8 w-full max-w-[600px] hover:scale-105 transition-transform duration-700">
            <img
              src="/Bargoglio-Logo-Rojo-con-Direccion-y-Logo-BAMusica.jpg"
              alt="Bargoglio - Música, Libros, Gastronomía"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Agenda Section (Shows) */}
      <section id="agenda" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Agenda</h2>
          <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-gold-600 to-transparent mx-auto"></div>
        </div>

        {loadingEvents ? (
          <div className="text-center text-stone-500 py-12">Cargando eventos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events
              .filter(e => !e.category || e.category === 'show')
              .map((event) => (
                <AgendaCard
                  key={event.id}
                  id={event.id || ""}
                  title={event.title}
                  date={event.date}
                  image={event.flyerUrl}
                  description={event.description}
                  price={
                    event.pricingType === 'free' ? 'Gratis' :
                      event.pricingType === 'general' ? `General:$${event.generalPrice}` :
                        event.zonesPrices[0]?.price ? `$${event.zonesPrices[0].price}` : undefined
                  }
                />
              ))}
          </div>
        )}
      </section>

      {/* Agenda Cultural Section */}
      {events.some(e => e.category === 'cultural') && (
        <section id="cultural" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/5 bg-stone-900/30">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Agenda Cultural</h2>
            <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-purple-600 to-transparent mx-auto"></div>
            <p className="text-stone-400 mt-4 max-w-2xl mx-auto">Charlas, presentaciones y encuentros especiales.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events
              .filter(e => e.category === 'cultural')
              .map((event) => (
                <AgendaCard
                  key={event.id}
                  id={event.id || ""}
                  title={event.title}
                  date={event.date}
                  image={event.flyerUrl}
                  description={event.description}
                  price={
                    event.pricingType === 'free' ? 'Gratis' :
                      event.pricingType === 'general' ? `General:$${event.generalPrice}` :
                        event.zonesPrices[0]?.price ? `$${event.zonesPrices[0].price}` : undefined
                  }
                />
              ))}
          </div>
        </section>
      )}

      {/* Menu Section */}
      <MenuSection />

      {/* Contact Section */}
      <section id="contacto-form" className="py-24 bg-charcoal-900/40 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Contacto</h2>
            <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-gold-600 to-transparent mx-auto"></div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-black py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-stone-600 text-sm">
            © {new Date().getFullYear()} Bargoglio. Todos los Derechos Reservados.
          </p>
          <a href="/login" className="text-stone-800 hover:text-stone-700 text-[10px] mt-4 block uppercase tracking-widest transition-colors">
            Acceso Administrativo
          </a>
        </div>
      </footer>

      <WhatsAppButton />
    </main>
  );
}
