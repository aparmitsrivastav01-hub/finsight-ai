import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import WhyFinSight from '../components/WhyFinSight';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-obsidian text-soft-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <WhyFinSight />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
