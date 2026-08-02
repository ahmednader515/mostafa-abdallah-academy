/**
 * Client-safe forum types, constants, and ACL helpers (no DB imports).
 */
import type { UserRole } from "@/lib/types";

export type ForumAudience = "public" | "logged_in" | "students" | "teachers" | "staff";

export const FORUM_AUDIENCES: ForumAudience[] = [
  "public",
  "logged_in",
  "students",
  "teachers",
  "staff",
];

export const FORUM_CATEGORY_ICONS = [
  "chat",
  "plane",
  "briefcase",
  "book",
  "mic",
  "globe",
  "ticket",
  "ship",
  "docs",
  "users",
] as const;

export type ForumCategoryIconKey = (typeof FORUM_CATEGORY_ICONS)[number];

export type ForumCategory = {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  icon: string;
  color: string;
  order: number;
  isVisible: boolean;
  isLocked: boolean;
  isPinned: boolean;
  isDefault: boolean;
  viewAudience: ForumAudience;
  createAudience: ForumAudience;
  threadCount?: number;
  createdAt?: Date;
};

export type ForumThread = {
  id: string;
  categoryId: string;
  authorId: string;
  authorName?: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount?: number;
  lastReplyAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
};

export type ForumReply = {
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  body: string;
  createdAt: Date;
};

export type ForumThreadSort = "newest" | "oldest" | "replies";

function isStaffRole(role: string): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
}

/** Staff (admin/assistant) always pass; otherwise match audience to role. */
export function userMatchesAudience(
  audience: ForumAudience,
  role: UserRole | string | null | undefined,
  isLoggedIn: boolean,
): boolean {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return true;
  switch (audience) {
    case "public":
      return true;
    case "logged_in":
      return isLoggedIn;
    case "students":
      return role === "STUDENT";
    case "teachers":
      return role === "TEACHER";
    case "staff":
      return isStaffRole(String(role ?? ""));
    default:
      return false;
  }
}

export function userCanViewCategory(
  category: Pick<ForumCategory, "isVisible" | "viewAudience">,
  role: UserRole | string | null | undefined,
  isLoggedIn: boolean,
): boolean {
  if (!category.isVisible && role !== "ADMIN" && role !== "ASSISTANT_ADMIN") return false;
  return userMatchesAudience(category.viewAudience, role, isLoggedIn);
}

export function userCanCreateInCategory(
  category: Pick<ForumCategory, "isVisible" | "isLocked" | "createAudience">,
  role: UserRole | string | null | undefined,
  isLoggedIn: boolean,
): boolean {
  if (!isLoggedIn) return false;
  if (category.isLocked && role !== "ADMIN" && role !== "ASSISTANT_ADMIN") return false;
  if (!category.isVisible && role !== "ADMIN" && role !== "ASSISTANT_ADMIN") return false;
  return userMatchesAudience(category.createAudience, role, isLoggedIn);
}
