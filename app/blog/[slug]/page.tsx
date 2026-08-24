import { fetchPublicBlogBySlug } from "@/app/actions/public";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import BlogBodyRenderer from "@/components/blog/BlogBodyRenderer";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { MoveLeft } from "lucide-react";
import { notFound } from "next/navigation";

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  // Unwrap params
  const { slug } = await params;
  
  let blog;
  try {
    blog = await fetchPublicBlogBySlug(slug);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      notFound();
    }
    // For other errors, we can just throw to let the nearest error.tsx handle it, or show a fallback.
    throw error;
  }

  const dateStr = new Date(blog.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      <article className="flex-1 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-32 w-full">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-8 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Blogs
        </Link>

        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            {blog.tags.map((tag: string) => (
              <span key={tag} className="bg-[#8E4A92] text-white px-3 py-1 rounded-full uppercase tracking-wider text-xs font-bold shadow-sm">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl text-[#222222] mb-6 leading-tight`}>
            {blog.title}
          </h1>
          
          <p className={`${hankenGrotesk.className} text-[#555555] font-medium`}>
            Published on {dateStr}
          </p>
        </header>

        {/* Cover Image */}
        {blog.coverImageUrl && (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-12 shadow-lg border-4 border-white">
            <Image
              src={blog.coverImageUrl}
              alt={blog.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-[#E5E7EB]">
          <BlogBodyRenderer html={blog.body} />
        </div>
      </article>

      <Footer />
    </main>
  );
}
