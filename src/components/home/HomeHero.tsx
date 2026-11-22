import { HomeHeroSlideshow } from "@/components/home/HomeHeroSlideshow";

type HomeHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  imageAlt: string;
  images: Array<{ id: string; src: string; alt: string }>;
};

export function HomeHero({
  eyebrow,
  title,
  description,
  cta,
  imageAlt,
  images,
}: HomeHeroProps) {
  return (
    <header className="hero" id="home-hero" role="banner">
      <div className="hero-image-container">
        <HomeHeroSlideshow
          key={images.map((image) => image.id).join(":") || "fallback"}
          images={images}
          fallbackAlt={imageAlt}
        />
        <div className="home-hero-overlay" aria-hidden="true" />
      </div>
      <div className="hero-content">
        <div className="welcome-text">
          <span className="line" aria-hidden="true" />
          <span className="text">{eyebrow}</span>
          <span className="line" aria-hidden="true" />
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        <a href="#prestations" className="btn-hero-scroll">
          {cta}
        </a>
      </div>
    </header>
  );
}
