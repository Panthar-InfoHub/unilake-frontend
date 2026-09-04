"use client";

import Image from "next/image";
import Link from "next/link";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { BlogListItem } from "@/app/types/blog";
import { MoveRight } from "lucide-react";

interface LatestBlogsProps {
  blogs: BlogListItem[];
}

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

export default function LatestBlogs({ blogs }: LatestBlogsProps) {
  if (!blogs || blogs.length === 0) {
    return null;
  }

  // Display max 3 blogs on the homepage
  const displayBlogs = blogs.slice(0, 3);

  return (
    <>
      {/* ===== Symmetrical Flared Purple Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/* Flared wave SVG */}
        <svg
          viewBox="0 0 1728 311"
          className="w-full block h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#914A8C"
            d="M66.9068 29.469L-1 0V297L60.6428 263.852C89.7598 248.195 122.304 240 155.364 240H278.89H416.829H535.5H698.224H836.5H1016.5H1151H1331.5H1500.38C1574.97 240 1648.08 260.856 1711.44 300.213L1728 310.5V0L1650.63 31.3555C1626.77 41.0275 1601.26 46 1575.51 46H1331.5H1151H1016.5H836.5H698.224H535.5H416.829H278.89H146.525C119.134 46 92.0343 40.3734 66.9068 29.469Z"
          />
        </svg>

        {/* Text overlay — centered vertically over the SVG */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto w-full px-8 relative flex items-center justify-center">
            <h2
              className={`
                ${chauPhilomeneOne.className}
                text-white
                uppercase
                text-xl
                sm:text-2xl
                md:text-3xl
                lg:text-4xl
                xl:text-5xl
                text-center
                z-30
                relative
              `}
            >
              BLOGS
            </h2>
          </div>
        </div>
      </div>

      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayBlogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          {/* View All Button */}
          <div className="mt-12 flex justify-center">
            <Link
              href="/blog"
              className="
                bg-transparent hover:bg-[#8E4A92] text-[#8E4A92] hover:text-white
                border-2 border-[#8E4A92]
                px-8 py-3 rounded-full font-bold shadow-sm
                transition-colors
                flex items-center justify-center gap-2
              "
            >
              <span>View All Posts</span>
              <MoveRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
