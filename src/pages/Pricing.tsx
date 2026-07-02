import PublicLayout from "@/components/landing/PublicLayout";
import PricingPlans from "@/components/PricingPlans";
import SEO from "@/components/SEO";

const Pricing = () => (
  <PublicLayout>
    <SEO
      title="Planes y precios — Disruptivaa"
      description="Elige el plan que mejor se adapte a tu negocio. Consola de agentes de IA, dashboards, integraciones y automatización. Sin compromisos, cancela cuando quieras."
      path="/pricing"
    />
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Planes y precios
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tu negocio. Sin compromisos, cancela cuando quieras.
        </p>
      </div>
      <PricingPlans />
    </section>
  </PublicLayout>
);

export default Pricing;
