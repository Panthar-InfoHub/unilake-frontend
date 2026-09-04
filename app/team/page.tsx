import Link from "next/link";
import Image from "next/image";
import { MoveLeft, Briefcase, Camera, MessageCircle } from "lucide-react";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import { fetchPublicTeamMembers } from "@/app/actions/public";

export default async function TeamPage() {
  const members = await fetchPublicTeamMembers();

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-9 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}>
            Our Team
          </h1>
          <p className={`${chauPhilomeneOne.className} text-lg md:text-xl text-[#555555] max-w-2xl mx-auto tracking-wide`}>
            Meet the creative minds bringing stories to life.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-8 w-full">
        {/* Back to Home Link */}
        <Link href="/" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-10 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {members && members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 lg:gap-x-12 pb-24">
            {members.map((member) => (
              <div key={member.id} className="flex justify-center">
                {/* Card with Exact Custom Background Frame PNG */}
                <div className="relative w-full max-w-[340px] aspect-[445/630] flex flex-col items-center text-center p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] group drop-shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
                  {/* Card Background Frame PNG */}
                  <Image
                    src="/assets/home_page/teamCardFrame.png"
                    alt="Card Background"
                    fill
                    className="pointer-events-none select-none z-0 object-contain"
                    priority
                  />

                  {/* Card Content Container */}
                  <div className="relative z-10 flex flex-col items-center text-center w-full h-full pt-6">
                    {/* Team Member Avatar */}
                    <div className="relative w-full aspect-square max-w-[170px] sm:max-w-[190px] mb-4 rounded-full overflow-hidden flex items-center justify-center bg-[#914B8C]/10 border-2 border-white shadow-sm">
                      {member.imageUrl ? (
                        <Image
                          src={member.imageUrl}
                          alt={member.name}
                          fill
                          sizes="190px"
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <span className={`${chauPhilomeneOne.className} text-[#914B8C] text-5xl uppercase`}>
                          {member.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h4 className={`${hankenGrotesk.className} text-[#914B8C] font-extrabold text-xl sm:text-2xl mb-1`}>
                      {member.name}
                    </h4>

                    {/* Role */}
                    <span className={`${hankenGrotesk.className} text-[#000000] font-bold text-sm sm:text-base mb-3 block`}>
                      ({member.role})
                    </span>

                    {/* Description */}
                    {member.description && (
                      <p className={`${hankenGrotesk.className} text-[#555555] text-xs sm:text-sm font-medium leading-relaxed mb-4 max-w-[250px]`}>
                        {member.description}
                      </p>
                    )}

                    {/* Social Links */}
                    {(member.linkedinUrl || member.instagramUrl || member.twitterUrl) && (
                      <div className="flex items-center justify-center gap-4 mt-auto pb-4">
                        {member.linkedinUrl && (
                          <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors cursor-pointer">
                            <Briefcase className="w-4 h-4" />
                          </a>
                        )}
                        {member.instagramUrl && (
                          <a href={member.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors cursor-pointer">
                            <Camera className="w-4 h-4" />
                          </a>
                        )}
                        {member.twitterUrl && (
                          <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors cursor-pointer">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
            <p className="text-[#555555] font-medium text-lg">No team members found.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
