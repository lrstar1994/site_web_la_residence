import Image from "next/image";

type HomeHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  imageAlt: string;
};

export function HomeHero({
  eyebrow,
  title,
  description,
  cta,
  imageAlt,
}: HomeHeroProps) {
  return (
    <header className="hero" id="home-hero" role="banner">
      <div className="hero-image-container">
        <Image
          src="/couverture-acceuil.png"
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="hero-img"
        />
        <div className="overlay" aria-hidden="true" />
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
