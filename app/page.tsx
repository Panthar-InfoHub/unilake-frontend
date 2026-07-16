import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import ChooseStory from "@/components/home/ChooseStory";
import HappyCustomers from "@/components/home/HappyCustomers";
import GoogleReviews from "@/components/home/GoogleReviews";
import OurTeam from "@/components/home/OurTeam";
import FaqFeedback from "@/components/home/FaqFeedback";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8E7D2] overflow-x-hidden">
      {/* ================= NAVBAR ================= */}

      <Header />


      {/*Home Page */}
      <Hero />
      <ChooseStory />
      <HappyCustomers />
      <GoogleReviews />
      <OurTeam />
      <FaqFeedback />

      <Footer />

    </main>
  );
}