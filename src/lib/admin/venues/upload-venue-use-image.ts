export function getVenueUseUploadedImagePathsFromFormData(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("uploaded_image_paths")
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  ];
}
