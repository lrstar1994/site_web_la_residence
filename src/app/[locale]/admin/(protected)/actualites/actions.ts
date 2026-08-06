"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  emptyAdminNewsFormValues,
  type AdminNewsFormState,
} from "@/lib/admin/news/admin-news-types";
import { deleteAdminNewsArticle } from "@/lib/admin/news/delete-admin-news";
import {
  getAdminNewsFormIntent,
  getAdminNewsFormValues,
  saveAdminNewsArticle,
} from "@/lib/admin/news/save-admin-news";
import {
  updateNewsQuickStatus,
  type AdminNewsQuickActionResult,
} from "@/lib/admin/news/update-news-status";

const defaultState: AdminNewsFormState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: emptyAdminNewsFormValues,
};

function revalidateNewsPaths() {
  revalidatePath("/fr/actualites");
  revalidatePath("/en/blog");
  revalidatePath("/fr/admin/actualites");
}

function revalidateNewsArticlePaths(articleId: string) {
  revalidateNewsPaths();
  revalidatePath(`/fr/admin/actualites/${articleId}/modifier`);
}

function getUploadedNewsImagePaths(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("uploaded_image_paths")
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  ];
}

function getDeletedNewsImageIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("deleted_image_ids")
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  ];
}

export async function createAdminNewsArticle(
  previousState: AdminNewsFormState = defaultState,
  formData: FormData,
): Promise<AdminNewsFormState> {
  void previousState;

  const result = await saveAdminNewsArticle({
    mode: "create",
    intent: getAdminNewsFormIntent(formData),
    values: getAdminNewsFormValues(formData),
    imagePaths: getUploadedNewsImagePaths(formData),
    deletedImageIds: getDeletedNewsImageIds(formData),
  });

  if (!result.ok) {
    return result;
  }

  revalidateNewsPaths();
  redirect("/fr/admin/actualites?notice=created");
}

export async function updateAdminNewsArticle(
  articleId: string,
  previousState: AdminNewsFormState = defaultState,
  formData: FormData,
): Promise<AdminNewsFormState> {
  void previousState;

  const result = await saveAdminNewsArticle({
    mode: "update",
    articleId,
    intent: getAdminNewsFormIntent(formData),
    values: getAdminNewsFormValues(formData),
    imagePaths: getUploadedNewsImagePaths(formData),
    deletedImageIds: getDeletedNewsImageIds(formData),
  });

  if (!result.ok) {
    return result;
  }

  revalidateNewsPaths();
  redirect("/fr/admin/actualites?notice=updated");
}

export async function publishNewsNowAction(
  articleId: string,
): Promise<AdminNewsQuickActionResult> {
  const result = await updateNewsQuickStatus(articleId, "publish_now");

  if (result.ok) {
    revalidateNewsArticlePaths(articleId);
  }

  return result;
}

export async function archiveNewsAction(
  articleId: string,
): Promise<AdminNewsQuickActionResult> {
  const result = await updateNewsQuickStatus(articleId, "archive");

  if (result.ok) {
    revalidateNewsArticlePaths(articleId);
  }

  return result;
}

export async function cancelScheduledNewsAction(
  articleId: string,
): Promise<AdminNewsQuickActionResult> {
  const result = await updateNewsQuickStatus(articleId, "cancel_schedule");

  if (result.ok) {
    revalidateNewsArticlePaths(articleId);
  }

  return result;
}

export async function republishNewsAction(
  articleId: string,
): Promise<AdminNewsQuickActionResult> {
  const result = await updateNewsQuickStatus(articleId, "republish");

  if (result.ok) {
    revalidateNewsArticlePaths(articleId);
  }

  return result;
}

export async function deleteAdminNewsArticleAction(articleId: string) {
  const result = await deleteAdminNewsArticle(articleId);

  if (!result.ok) {
    return result;
  }

  revalidateNewsArticlePaths(articleId);
  redirect("/fr/admin/actualites?deleted=1");
}
