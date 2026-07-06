export interface StoryImage {
  id: number;
  src: string;
  alt: string;
}

export interface Story {
  id: number;
  title: string;
  description: string;
  ageRange: string;
  category: string;
  pages: number;
  price: number;
  originalPrice: number;
  images: StoryImage[];
}

export const stories: Story[] = [
  {
    id: 1,
    title: "WHEN SARA GROW UP",
    description:
      "A magical journey through imagination soar above clouds, tame dragons, and conquer wild quests.",
    ageRange: "AGE 2-7",
    category: "MORALS",
    pages: 30,
    price: 1199,
    originalPrice: 1499,
    images: [
      {
        id: 1,
        src: "/assets/home_page/stories/cover_1.png",
        alt: "Sara flying above clouds at sunset",
      },
      {
        id: 2,
        src: "/assets/home_page/stories/cover_2.png",
        alt: "Sara riding a friendly dragon",
      },
      {
        id: 3,
        src: "/assets/home_page/stories/cover_3.png",
        alt: "Sara in an enchanted forest",
      },
    ],
  },
  {
    id: 2,
    title: "WHEN SARA GROW UP",
    description:
      "A magical journey through imagination soar above clouds, tame dragons, and conquer wild quests.",
    ageRange: "AGE 2-7",
    category: "MORALS",
    pages: 30,
    price: 1199,
    originalPrice: 1499,
    images: [
      {
        id: 1,
        src: "/assets/home_page/stories/cover_2.png",
        alt: "Sara riding a friendly dragon",
      },
      {
        id: 2,
        src: "/assets/home_page/stories/cover_3.png",
        alt: "Sara in an enchanted forest",
      },
      {
        id: 3,
        src: "/assets/home_page/stories/cover_1.png",
        alt: "Sara flying above clouds at sunset",
      },
    ],
  },
  {
    id: 3,
    title: "WHEN SARA GROW UP",
    description:
      "A magical journey through imagination soar above clouds, tame dragons, and conquer wild quests.",
    ageRange: "AGE 2-7",
    category: "MORALS",
    pages: 30,
    price: 1199,
    originalPrice: 1499,
    images: [
      {
        id: 1,
        src: "/assets/home_page/stories/cover_3.png",
        alt: "Sara in an enchanted forest",
      },
      {
        id: 2,
        src: "/assets/home_page/stories/cover_1.png",
        alt: "Sara flying above clouds at sunset",
      },
      {
        id: 3,
        src: "/assets/home_page/stories/cover_2.png",
        alt: "Sara riding a friendly dragon",
      },
    ],
  },
  {
    id: 4,
    title: "WHEN SARA GROW UP",
    description:
      "A magical journey through imagination soar above clouds, tame dragons, and conquer wild quests.",
    ageRange: "AGE 2-7",
    category: "MORALS",
    pages: 30,
    price: 1199,
    originalPrice: 1499,
    images: [
      {
        id: 1,
        src: "/assets/home_page/stories/cover_1.png",
        alt: "Sara flying above clouds at sunset",
      },
      {
        id: 2,
        src: "/assets/home_page/stories/cover_3.png",
        alt: "Sara in an enchanted forest",
      },
      {
        id: 3,
        src: "/assets/home_page/stories/cover_2.png",
        alt: "Sara riding a friendly dragon",
      },
    ],
  },
  {
    id: 5,
    title: "WHEN SARA GROW UP",
    description:
      "A magical journey through imagination soar above clouds, tame dragons, and conquer wild quests.",
    ageRange: "AGE 2-7",
    category: "MORALS",
    pages: 30,
    price: 1199,
    originalPrice: 1499,
    images: [
      {
        id: 1,
        src: "/assets/home_page/stories/cover_2.png",
        alt: "Sara riding a friendly dragon",
      },
      {
        id: 2,
        src: "/assets/home_page/stories/cover_1.png",
        alt: "Sara flying above clouds at sunset",
      },
      {
        id: 3,
        src: "/assets/home_page/stories/cover_3.png",
        alt: "Sara in an enchanted forest",
      },
    ],
  },
  {
    id: 6,
    title: "WHEN SARA GROW UP",
    description:
      "A magical journey through imagination soar above clouds, tame dragons, and conquer wild quests.",
    ageRange: "AGE 2-7",
    category: "MORALS",
    pages: 30,
    price: 1199,
    originalPrice: 1499,
    images: [
      {
        id: 1,
        src: "/assets/home_page/stories/cover_3.png",
        alt: "Sara in an enchanted forest",
      },
      {
        id: 2,
        src: "/assets/home_page/stories/cover_2.png",
        alt: "Sara riding a friendly dragon",
      },
      {
        id: 3,
        src: "/assets/home_page/stories/cover_1.png",
        alt: "Sara flying above clouds at sunset",
      },
    ],
  },
];
