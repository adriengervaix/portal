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
import { CategoryActionsMenu } from "./category-actions-menu";
import type { Category } from "@/types";

interface CategoryAccordionProps {
  categories: Category[];
  onUpdated?: () => void;
}

export function CategoryAccordion({
  categories,
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
            className="hover:no-underline"
            actions={
              <div onClick={(e) => e.stopPropagation()}>
                <CategoryActionsMenu
                  category={category}
                  onUpdated={onUpdated}
                />
              </div>
            }
          >
            <span className="truncate">{category.name}</span>
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
