import { Suspense } from "react";
import { BookmarksPage } from "@/components/bookmarks/bookmarks-page";

export const metadata = {
  title: "Bookmarks",
  description: "Browse Dropbox media files by folder",
};

/**
 * Bookmarks page: displays Dropbox folders and media in a masonry grid.
 */
export default function BookmarksRoute() {
  return (
    <div className="w-full px-4 py-6">
      <Suspense fallback={<p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>}>
        <BookmarksPage />
      </Suspense>
    </div>
  );
}
