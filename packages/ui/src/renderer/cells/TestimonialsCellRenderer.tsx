/**
 * @file packages/ui/src/renderer/cells/TestimonialsCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated testimonials cell as static cards or a marquee.
 *
 * @remarks
 * Testimonials without both quote and author name are ignored; marquee mode duplicates the rendered group for continuous scrolling.
 */

import type {
  TestimonialItemShape,
  TestimonialsCellShape,
} from "@compoz/validation/pages/blocks/cells/cell";
import { Star } from "lucide-react";

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import type { SiteTestimonialsUi } from "@compoz/ui/site/site-ui.types";

export type TestimonialsCellRendererProps = Readonly<{
  cell?: TestimonialsCellShape | null;
  ui: SiteTestimonialsUi;
}>;

type TestimonialCardProps = Readonly<{
  item: TestimonialItemShape;
  ui: SiteTestimonialsUi;
}>;

type TestimonialCardsProps = Readonly<{
  items: readonly TestimonialItemShape[];
  ui: SiteTestimonialsUi;
  isMarquee: boolean;
  keyPrefix: string;
}>;

function getQuoteParagraphs(quote: string): string[] {
  return quote
    .split(/\n\s*\n/g)
    .map((paragraph) => normalizeString(paragraph, ""))
    .filter(Boolean);
}

function TestimonialCard({ item, ui }: TestimonialCardProps) {
  const quote = normalizeString(item.quote, "");
  const quoteParagraphs = getQuoteParagraphs(quote);
  const authorName = normalizeString(item.authorName, "");
  const authorRole = normalizeString(item.authorRole, "");
  const authorImage = normalizeString(item.authorImage, "");

  return (
    <Card className={ui.card}>
      <CardContent className={ui.cardContent}>
        {item.rating ? (
          <div className={ui.rating} aria-label={`Note : ${item.rating} sur 5`}>
            {Array.from({ length: 5 }, (_, index) => {
              const isFilled = index < item.rating!;

              return (
                <Star
                  key={index}
                  className={cn(ui.star, !isFilled && "opacity-30")}
                  fill={isFilled ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        ) : null}

        <blockquote className={ui.quote}>
          {quoteParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </blockquote>
      </CardContent>

      <CardFooter className={ui.author}>
        {authorImage ? (
          <span className={ui.authorImageWrapper}>
            <SiteAppImage
              image={{ src: authorImage, alt: "" }}
              fill
              sizes="48px"
              className={ui.authorImage}
            />
          </span>
        ) : null}

        <span className={ui.authorText}>
          <cite className={ui.authorName}>{authorName}</cite>
          {authorRole ? (
            <span className={ui.authorRole}>{authorRole}</span>
          ) : null}
        </span>
      </CardFooter>
    </Card>
  );
}

function TestimonialCards({
  items,
  ui,
  isMarquee,
  keyPrefix,
}: TestimonialCardsProps) {
  return items.map((item) => (
    <div
      key={`${keyPrefix}-${item.id}`}
      className={cn(ui.item, isMarquee ? ui.marqueeItem : ui.staticItem)}
    >
      <TestimonialCard item={item} ui={ui} />
    </div>
  ));
}

function getStaticGridClassName(
  itemCount: number,
  ui: SiteTestimonialsUi,
): string {
  if (itemCount === 1) return ui.staticGridOne;
  if (itemCount === 2) return ui.staticGridTwo;
  return ui.staticGridMany;
}

export function TestimonialsCellRenderer({
  cell,
  ui,
}: TestimonialsCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    return Boolean(
      normalizeString(item.quote, "") && normalizeString(item.authorName, ""),
    );
  });

  if (items.length < 1) return null;

  const title = normalizeString(cell.title, "");
  const description = normalizeString(cell.description, "");
  const isMarquee = cell.displayMode === "marquee" && items.length > 1;
  const staticGridClassName = getStaticGridClassName(items.length, ui);

  return (
    <section
      className={ui.root}
      data-cell="testimonials"
      data-display-mode={isMarquee ? "marquee" : "static"}
    >
      {title || description ? (
        <header className={ui.header}>
          {title ? <h3 className={ui.title}>{title}</h3> : null}
          {description ? <p className={ui.description}>{description}</p> : null}
        </header>
      ) : null}

      {isMarquee ? (
        <div className={ui.marqueeViewport}>
          <div className={ui.marqueeTrack}>
            <div className={ui.marqueeGroup}>
              <TestimonialCards
                items={items}
                ui={ui}
                isMarquee={isMarquee}
                keyPrefix="testimonial"
              />
            </div>

            <div
              className={cn(ui.marqueeGroup, ui.marqueeDuplicate)}
              aria-hidden="true"
            >
              <TestimonialCards
                items={items}
                ui={ui}
                isMarquee={isMarquee}
                keyPrefix="testimonial-duplicate"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className={staticGridClassName}>
          <TestimonialCards
            items={items}
            ui={ui}
            isMarquee={isMarquee}
            keyPrefix="testimonial"
          />
        </div>
      )}
    </section>
  );
}

TestimonialsCellRenderer.displayName = "TestimonialsCellRenderer";
