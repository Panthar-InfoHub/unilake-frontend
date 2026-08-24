import { fetchPublicBlogs } from "@/app/actions/public";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { MoveRight, MoveLeft } from "lucide-react";

export default async function BlogIndexPage() {
  const blogs = await fetchPublicBlogs();

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-16 bg-[#8E4A92] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase mb-4`}>
            Our Blog
          </h1>
          <p className={`${hankenGrotesk.className} text-lg md:text-xl text-[#F8E7D2] max-w-2xl mx-auto`}>
            Discover stories, tips, and updates from the world of personalized children&rsquo;s books.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 w-full">
        {/* Back to Home Link */}
        <Link href="/" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-10 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
            <p className="text-[#555555] font-medium text-lg">No posts available yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new articles!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => {
              const dateStr = new Date(blog.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              const displayTags = blog.tags.slice(0, 3);

              return (
                <Link 
                  href={`/blog/${blog.slug}`} 
                  key={blog.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group border border-transparent hover:border-[#8E4A92]/20"
                >
                  {/* Cover Image */}
                  <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
                    {blog.coverImageUrl ? (
                      <Image
                        src={blog.coverImageUrl}
                        alt={blog.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#F3E8FF] text-[#8E4A92]/40">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Meta: Tags & Date */}
                    <div className="flex items-center justify-between mb-3 text-xs font-medium">
                      <div className="flex gap-2 flex-wrap">
                        {displayTags.map(tag => (
                          <span key={tag} className="bg-[#F3E8FF] text-[#8E4A92] px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-gray-500 shrink-0">{dateStr}</span>
                    </div>

                    {/* Title */}
                    <h3 className={`${hankenGrotesk.className} font-extrabold text-xl text-[#222222] mb-3 line-clamp-2 group-hover:text-[#8E4A92] transition-colors`}>
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    {blog.excerpt && (
                      <p className={`${hankenGrotesk.className} text-[#555555] text-sm leading-relaxed line-clamp-3 mb-4 flex-1`}>
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Read More link */}
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center text-[#8E4A92] font-bold text-sm">
                      Read Article <MoveRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
