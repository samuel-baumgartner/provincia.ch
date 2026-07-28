import Image from "next/image";

type Feature = {
  id: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
};

type Props = {
  features: Feature[];
};

export default function LandingFeatures({ features }: Props) {
  return (
    <div className="space-y-0">
      {features.map((feature, index) => {
        const imageFirst = index % 2 === 1;
        return (
          <article
            key={feature.id}
            className={`grid gap-8 border-t border-ink-border py-16 lg:grid-cols-2 lg:items-center lg:gap-14 ${
              imageFirst ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cypress">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-stone md:text-3xl">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-stone-muted md:text-lg">{feature.text}</p>
            </div>
            <div className="overflow-hidden border border-ink-border shadow-lg shadow-black/30 transition duration-500 hover:border-cypress/40">
              <Image
                src={feature.image}
                alt={feature.imageAlt}
                width={1200}
                height={800}
                className="h-auto w-full"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
