import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Header,
  Footer,
  HeroSection,
  CategoryCarousel,
  FeaturesSection,
  TestimonialCarousel,
  StatsSection,
  CTASection,
} from '@/components/landing';

import heroBackground from '@/assets/hero-background.png';

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background image with reduced opacity */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          opacity: 0.15
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <Header />
        
        <main>
          <HeroSection />
          <StatsSection />
          <CategoryCarousel />
          <FeaturesSection />
          <TestimonialCarousel />
          <CTASection />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
