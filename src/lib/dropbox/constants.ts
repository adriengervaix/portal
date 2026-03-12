/** Image extensions supported for display in the grid. */
export const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".tiff",
  ".tif",
  ".ppm",
];

/** Video extensions supported for display. */
export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

/** Combined list for filtering media files. */
export const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];
