import { fetchPublicBlogs } from "@/app/actions/public";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { MoveLeft } from "lucide-react";
import { BlogListItem } from "@/app/types/blog";

function BlogCard({ blog }: { blog: BlogListItem }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="relative group block w-full"
    >
      {/* SVG background shape — default state */}
      <Image
        src="/assets/home_page/blog.svg"
        alt=""
        width={387}
        height={497}
        aria-hidden="true"
        className="w-full h-auto block transition-opacity duration-900 ease-in-out group-hover:opacity-0"
        draggable={false}
      />
      {/* SVG background shape — hover state */}
      <Image
        src="/assets/home_page/blog_on_hover.svg"
        alt=""
        width={387}
        height={497}
        aria-hidden="true"
        className="w-full h-auto absolute inset-0 opacity-0 transition-opacity duration-900 ease-in-out group-hover:opacity-100"
        draggable={false}
      />

      {/* Card content overlay */}
      <div className="absolute inset-0 flex flex-col px-[10%] pt-[8%] pb-[8%]">
        {/* Top section: Title (left) — arrow is part of the SVG */}
        <div className="pr-[35%]">
          <h3
            className={`${chauPhilomeneOne.className} text-white text-xl sm:text-[22px] leading-[1.15] uppercase line-clamp-3`}
          >
            {blog.title}
          </h3>
        </div>

        {/* Excerpt */}
        {blog.excerpt && (
          <p
            className={`${hankenGrotesk.className} text-white/90 text-xs sm:text-sm leading-relaxed mt-2 line-clamp-3 pr-[10%]`}
          >
            {blog.excerpt}
          </p>
        )}

        {/* Cover image — inset in the lower portion */}
        <div className="mt-auto relative w-full aspect-[16/10] rounded-xl overflow-hidden">
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-12 h-12"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function BlogIndexPage() {
  const blogs = await fetchPublicBlogs();

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-9 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}>
            Our Blog
          </h1>
          <p className={`${chauPhilomeneOne.className} text-lg md:text-xl text-[#555555] max-w-2xl mx-auto tracking-wide`}>
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
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
