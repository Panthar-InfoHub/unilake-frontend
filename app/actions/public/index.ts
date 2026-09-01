import api from "@/app/lib/axios";
import { CustomerReview } from "@/app/types/customerReview";
import { TeamMember } from "@/app/types/teamMember";
import { SubmitFeedbackPayload } from "@/app/types/publicFeedback";
import { HowItWorks } from "@/app/types/howItWorks";
import { Faq, FaqPlacement } from "@/app/types/faq";
import { Blog, BlogListItem } from "@/app/types/blog";

export async function fetchPublicCustomerReviews(): Promise<CustomerReview[]> {
  try {
    const { data } = await api.get<CustomerReview[]>("/api/public/customer-reviews");
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchPublicTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data } = await api.get<TeamMember[]>("/api/public/team-members");
    return data || [];
  } catch {
    return [];
  }
}

export async function submitPublicFeedback(payload: SubmitFeedbackPayload): Promise<void> {
  await api.post("/api/public/feedbacks", payload);
}

export async function fetchPublicHowItWorks(): Promise<HowItWorks | null> {
  try {
    const { data } = await api.get<HowItWorks | null>("/api/public/how-it-works");
    return data;
  } catch {
    return null;
  }
}

export async function fetchPublicFaqs(placement: FaqPlacement): Promise<Faq[]> {
  try {
    const { data } = await api.get<Faq[]>(`/api/public/faqs?placement=${placement}`);
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchPublicBlogs(): Promise<BlogListItem[]> {
  try {
    const { data } = await api.get<BlogListItem[]>("/api/public/blogs");
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchPublicBlogBySlug(slug: string): Promise<Blog> {
  const { data } = await api.get<Blog>(`/api/public/blogs/${slug}`);
  return data;
}
