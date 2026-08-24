export type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Blog = BlogListItem & {
  body: string;
};

export type BlogUploadUrlResponse = {
  uploadUrl: string;
  key: string;
};
