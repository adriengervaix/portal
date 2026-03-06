"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImageGridCategory } from "./image-grid-category";
import { TextMarkdownCategory } from "./text-markdown-category";
import { ExternalLinkCategory } from "./external-link-category";
import type { Category } from "@/types";

interface CategoryAccordionProps {
  categories: Category[];
  onOpenPanel: (categoryId: string) => void;
  onUpdated?: () => void;
}

export function CategoryAccordion({
  categories,
  onOpenPanel,
  onUpdated,
}: CategoryAccordionProps) {
  if (categories.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Aucune catégorie. Ajoutez-en une pour commencer.
      </p>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {categories.map((category) => (
        <AccordionItem key={category.id} value={category.id}>
          <AccordionTrigger
            onClick={() => onOpenPanel(category.id)}
            className="hover:no-underline"
          >
            {category.name}
          </AccordionTrigger>
          <AccordionContent>
            {category.format === "IMAGE_GRID" && (
              <ImageGridCategory
                category={category}
                onUpdated={onUpdated}
              />
            )}
            {category.format === "TEXT_MARKDOWN" && (
              <TextMarkdownCategory
                category={category}
                onUpdated={onUpdated}
              />
            )}
            {category.format === "EXTERNAL_LINK" && (
              <ExternalLinkCategory
                category={category}
                onUpdated={onUpdated}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
