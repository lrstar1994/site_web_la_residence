"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { submitEventQuoteRequestAction } from "@/app/[locale]/evenements/actions";
import { siteConfig } from "@/data/site";
import type { EventQuoteFormState } from "@/lib/events/event-quote-validation";
import type { Locale } from "@/lib/i18n/routing";
import type { EventQuoteField } from "@/types/event-quote";
import type { EventService } from "@/types/event-service";

type EventQuoteFormProps = {
  locale: Locale;
  services: EventService[];
  fields: EventQuoteField[];
};

const initialState: EventQuoteFormState = {
  ok: false,
  message: "",
  fieldErrors: {},
};

function fieldLabel(field: EventQuoteField, locale: Locale) {
  return locale === "fr" ? field.labelFr : field.labelEn;
}

function optionLabel(option: EventQuoteField["options"][number], locale: Locale) {
  return locale === "fr" ? option.labelFr : option.labelEn;
}

function isVisible(field: EventQuoteField, answers: Record<string, unknown>) {
  const condition = field.conditionalLogic;
  if (!condition) return true;
  const value = answers[condition.dependsOn];

  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "not_equals":
      return value !== condition.value;
    case "contains":
      return Array.isArray(value) && value.includes(condition.value);
    case "greater_than":
      return Number(value) > Number(condition.value);
    default:
      return false;
  }
}

function errorId(name: string) {
  return `event-quote-${name}-error`;
}

function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <strong className="event-quote-field-error" id={errorId(name)}>
      {error}
    </strong>
  );
}

function RequiredMark() {
  return <span className="event-quote-required" aria-hidden="true">*</span>;
}

function SectionHeading({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="event-quote-section-heading">
      <span className="event-quote-section-index">{index}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function EventQuoteForm({ locale, services, fields }: EventQuoteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const eventTypeSelectRef = useRef<HTMLSelectElement>(null);
  const [state, formAction, isPending] = useActionState(
    submitEventQuoteRequestAction.bind(null, locale),
    initialState,
  );
  const [eventTypeId, setEventTypeId] = useState(services[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const selectedFields = useMemo(
    () => fields.filter((field) => field.eventTypeId === eventTypeId && field.isActive),
    [eventTypeId, fields],
  );
  const visibleFields = selectedFields.filter((field) => isVisible(field, answers));
  const t = {
    kicker: locale === "fr" ? "Votre événement" : "Your event",
    title: locale === "fr" ? "Demande de devis" : "Request a quote",
    intro:
      locale === "fr"
        ? "Parlez-nous de votre projet et notre équipe vous proposera une offre adaptée."
        : "Tell us about your project and our team will prepare a tailored offer.",
    contact: locale === "fr" ? "Vos coordonnées" : "Your contact details",
    contactHelp:
      locale === "fr"
        ? "Comment pouvons-nous vous contacter ?"
        : "How can we contact you?",
    event: locale === "fr" ? "Votre événement" : "Your event",
    eventHelp:
      locale === "fr"
        ? "Indiquez les premières informations utiles à notre équipe."
        : "Share the first useful details with our team.",
    needs: locale === "fr" ? "Vos besoins spécifiques" : "Your specific needs",
    needsHelp:
      locale === "fr"
        ? "Les options s'adaptent au type d'événement sélectionné."
        : "Options adapt to the selected event type.",
    more: locale === "fr" ? "Informations complémentaires" : "Additional information",
    moreHelp:
      locale === "fr"
        ? "Ajoutez les détails qui aideront à préparer votre devis."
        : "Add any details that will help us prepare your quote.",
    fullName: locale === "fr" ? "Nom complet" : "Full name",
    email: locale === "fr" ? "Email" : "Email",
    phone: locale === "fr" ? "Téléphone" : "Phone",
    whatsapp: "WhatsApp",
    eventType: locale === "fr" ? "Type d'événement" : "Event type",
    eventTypeHelp:
      locale === "fr"
        ? "Les options suivantes s'adapteront automatiquement à votre sélection."
        : "The following options will automatically adapt to your selection.",
    eventDate: locale === "fr" ? "Date envisagée" : "Planned date",
    budget: locale === "fr" ? "Budget estimatif" : "Estimated budget",
    details: locale === "fr" ? "Précisions supplémentaires" : "Additional details",
    submit: locale === "fr" ? "Envoyer ma demande" : "Send my request",
    pending: locale === "fr" ? "Envoi en cours..." : "Sending...",
    yes: locale === "fr" ? "Oui" : "Yes",
    no: locale === "fr" ? "Non" : "No",
    introKicker: locale === "fr" ? "Organisons votre événement" : "Plan your event",
    introTitle:
      locale === "fr"
        ? "Un devis adapté à votre projet"
        : "A quote tailored to your project",
    introText:
      locale === "fr"
        ? "Séminaire, réception, mariage, anniversaire ou événement privé : notre équipe vous accompagne dans l'organisation de chaque détail."
        : "Seminar, reception, wedding, birthday or private event: our team will help you plan every detail.",
    benefits:
      locale === "fr"
        ? [
            "Offre personnalisée",
            "Accompagnement par notre équipe",
            "Réponse rapide",
            "Solution adaptée à votre budget",
          ]
        : [
            "Personalised offer",
            "Support from our team",
            "Quick response",
            "Solution tailored to your budget",
          ],
    helpTitle: locale === "fr" ? "Besoin d'aide ?" : "Need help?",
    formTitle: locale === "fr" ? "Demande de devis" : "Request a quote",
    formIntro:
      locale === "fr"
        ? "Complétez les informations ci-dessous afin que notre équipe puisse préparer une proposition personnalisée."
        : "Complete the information below so our team can prepare a personalised proposal.",
    reassurance:
      locale === "fr"
        ? "Les informations transmises sont utilisées uniquement pour traiter votre demande."
        : "The information provided is used only to process your request.",
  };

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  useEffect(() => {
    function handleQuoteSelection(event: Event) {
      const customEvent = event as CustomEvent<{ serviceId?: string }>;
      const serviceId = customEvent.detail?.serviceId;

      if (!serviceId || !services.some((service) => service.id === serviceId)) {
        return;
      }

      setEventTypeId(serviceId);
      setAnswers({});
      window.setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        eventTypeSelectRef.current?.focus({ preventScroll: true });
      }, 0);
    }

    window.addEventListener("event-quote-select", handleQuoteSelection);
    return () => window.removeEventListener("event-quote-select", handleQuoteSelection);
  }, [services]);

  function updateAnswer(field: EventQuoteField, value: unknown) {
    setAnswers((current) => ({ ...current, [field.fieldKey]: value }));
  }

  return (
    <section className="event-quote-section" aria-labelledby="event-quote-title">
      <div className="event-quote-layout">
        <aside className="event-quote-intro" aria-label={t.introKicker}>
          <div className="event-quote-intro-content">
            <p className="event-quote-intro-kicker">{t.introKicker}</p>
            <h2 id="event-quote-title">{t.introTitle}</h2>
            <p>{t.introText}</p>
            <ul className="event-quote-benefits">
              {t.benefits.map((benefit) => (
                <li key={benefit}>
                  <span aria-hidden="true">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="event-quote-contact-card">
              <span>{t.helpTitle}</span>
              <a href={`tel:${siteConfig.contact.phoneHref}`}>{siteConfig.contact.phoneDisplay}</a>
            </div>
          </div>
        </aside>

        <form ref={formRef} className="event-quote-form" action={formAction}>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="event-quote-honeypot" />
          <header className="event-quote-header">
            <p className="event-quote-kicker">{t.kicker}</p>
            <h3>{t.formTitle}</h3>
            <p>{t.formIntro}</p>
          </header>

          {state.message ? (
            <section
              className={state.ok ? "event-quote-success" : "event-quote-alert"}
              role={state.ok ? "status" : "alert"}
              aria-live="polite"
            >
              <span aria-hidden="true">{state.ok ? "✓" : "!"}</span>
              <div>
                <strong>
                  {state.ok
                    ? locale === "fr"
                      ? "Votre demande a bien été envoyée"
                      : "Your request has been sent"
                    : locale === "fr"
                      ? "Une erreur est survenue"
                      : "Something went wrong"}
                </strong>
                <p>{state.message}</p>
              </div>
            </section>
          ) : null}

          <fieldset className="event-quote-panel">
            <legend className="sr-only">{t.contact}</legend>
            <SectionHeading index="01" title={t.contact} description={t.contactHelp} />
            <div className="event-quote-grid">
              <label className="event-quote-field">
                <span className="event-quote-label">{t.fullName} <RequiredMark /></span>
                <input
                  className="event-quote-control"
                  name="full_name"
                  required
                  maxLength={180}
                  aria-invalid={Boolean(state.fieldErrors.full_name)}
                  aria-describedby={state.fieldErrors.full_name ? errorId("full_name") : undefined}
                />
                <FieldError name="full_name" error={state.fieldErrors.full_name} />
              </label>
              <label className="event-quote-field">
                <span className="event-quote-label">{t.email} <RequiredMark /></span>
                <input
                  className="event-quote-control"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  aria-invalid={Boolean(state.fieldErrors.email)}
                  aria-describedby={state.fieldErrors.email ? errorId("email") : undefined}
                />
                <FieldError name="email" error={state.fieldErrors.email} />
              </label>
              <label className="event-quote-field">
                <span className="event-quote-label">{t.phone} <RequiredMark /></span>
                <input
                  className="event-quote-control"
                  name="phone"
                  required
                  maxLength={80}
                  aria-invalid={Boolean(state.fieldErrors.phone)}
                  aria-describedby={state.fieldErrors.phone ? errorId("phone") : undefined}
                />
                <FieldError name="phone" error={state.fieldErrors.phone} />
              </label>
              <label className="event-quote-field">
                <span className="event-quote-label">{t.whatsapp}</span>
                <input className="event-quote-control" name="whatsapp" maxLength={80} />
              </label>
            </div>
          </fieldset>

          <fieldset className="event-quote-panel">
            <legend className="sr-only">{t.event}</legend>
            <SectionHeading index="02" title={t.event} description={t.eventHelp} />
            <div className="event-quote-grid">
              <label className="event-quote-field event-quote-featured-field">
                <span className="event-quote-label">{t.eventType} <RequiredMark /></span>
                <select
                  ref={eventTypeSelectRef}
                  className="event-quote-control"
                  name="event_type_id"
                  value={eventTypeId}
                  required
                  aria-invalid={Boolean(state.fieldErrors.event_type_id)}
                  aria-describedby={state.fieldErrors.event_type_id ? errorId("event_type_id") : "event-quote-type-help"}
                  onChange={(event) => {
                    setEventTypeId(event.target.value);
                    setAnswers({});
                  }}
                >
                  <option value="">{locale === "fr" ? "Choisir" : "Choose"}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title[locale]}
                    </option>
                  ))}
                </select>
                <small className="event-quote-help" id="event-quote-type-help">{t.eventTypeHelp}</small>
                <FieldError name="event_type_id" error={state.fieldErrors.event_type_id} />
              </label>
              <label className="event-quote-field">
                <span className="event-quote-label">{t.eventDate}</span>
                <input className="event-quote-control" name="event_date" type="date" />
              </label>
              <label className="event-quote-field event-quote-budget-field">
                <span className="event-quote-label">{t.budget}</span>
                <span className="event-quote-budget-control">
                  <input
                    className="event-quote-control"
                    name="estimated_budget"
                    type="number"
                    min="0"
                    step="1000"
                    aria-invalid={Boolean(state.fieldErrors.estimated_budget)}
                    aria-describedby={state.fieldErrors.estimated_budget ? errorId("estimated_budget") : undefined}
                  />
                  <span>Ariary</span>
                </span>
                <FieldError name="estimated_budget" error={state.fieldErrors.estimated_budget} />
              </label>
            </div>
          </fieldset>

          {visibleFields.length > 0 ? (
            <fieldset className="event-quote-panel event-quote-dynamic-fields">
              <legend className="sr-only">{t.needs}</legend>
              <SectionHeading index="03" title={t.needs} description={t.needsHelp} />
              <div className="event-quote-grid">
                {visibleFields.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    locale={locale}
                    yes={t.yes}
                    no={t.no}
                    error={state.fieldErrors[field.fieldKey]}
                    onChange={updateAnswer}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="event-quote-panel">
            <legend className="sr-only">{t.more}</legend>
            <SectionHeading index="04" title={t.more} description={t.moreHelp} />
            <label className="event-quote-field event-quote-field--full">
              <span className="event-quote-label">{t.details}</span>
              <textarea
                className="event-quote-control"
                name="additional_details"
                rows={5}
                maxLength={3000}
                aria-invalid={Boolean(state.fieldErrors.additional_details)}
                aria-describedby={state.fieldErrors.additional_details ? errorId("additional_details") : undefined}
              />
              <FieldError name="additional_details" error={state.fieldErrors.additional_details} />
            </label>
          </fieldset>

          <footer className="event-quote-footer">
            <button className="event-quote-submit" type="submit" disabled={isPending}>
              <span>{isPending ? t.pending : t.submit}</span>
            </button>
            <p>{t.reassurance}</p>
          </footer>
        </form>
      </div>
    </section>
  );
}

function DynamicField({
  field,
  locale,
  yes,
  no,
  error,
  onChange,
}: {
  field: EventQuoteField;
  locale: Locale;
  yes: string;
  no: string;
  error?: string;
  onChange: (field: EventQuoteField, value: unknown) => void;
}) {
  const name = `specific_${field.fieldKey}`;
  const label = fieldLabel(field, locale);
  const describedBy = error ? errorId(name) : undefined;

  if (field.fieldType === "textarea") {
    return (
      <label className="event-quote-field event-quote-field--full">
        <span className="event-quote-label">{label} {field.isRequired ? <RequiredMark /> : null}</span>
        <textarea className="event-quote-control" name={name} rows={4} required={field.isRequired} aria-invalid={Boolean(error)} aria-describedby={describedBy} />
        <FieldError name={name} error={error} />
      </label>
    );
  }

  if (field.fieldType === "number") {
    return (
      <label className="event-quote-field">
        <span className="event-quote-label">{label} {field.isRequired ? <RequiredMark /> : null}</span>
        <input className="event-quote-control" name={name} type="number" min={0} required={field.isRequired} aria-invalid={Boolean(error)} aria-describedby={describedBy} onChange={(event) => onChange(field, event.target.value ? Number(event.target.value) : null)} />
        <FieldError name={name} error={error} />
      </label>
    );
  }

  if (field.fieldType === "date") {
    return (
      <label className="event-quote-field">
        <span className="event-quote-label">{label} {field.isRequired ? <RequiredMark /> : null}</span>
        <input className="event-quote-control" name={name} type="date" required={field.isRequired} aria-invalid={Boolean(error)} aria-describedby={describedBy} onChange={(event) => onChange(field, event.target.value)} />
        <FieldError name={name} error={error} />
      </label>
    );
  }

  if (field.fieldType === "boolean") {
    return (
      <fieldset className="event-quote-choice-group event-quote-field--full">
        <legend>{label} {field.isRequired ? <RequiredMark /> : null}</legend>
        <div className="event-quote-option-grid compact">
          <label className="event-quote-option-card">
            <input type="radio" name={name} value="false" defaultChecked onChange={() => onChange(field, false)} />
            <span>{no}</span>
          </label>
          <label className="event-quote-option-card">
            <input type="radio" name={name} value="true" onChange={() => onChange(field, true)} />
            <span>{yes}</span>
          </label>
        </div>
        <FieldError name={name} error={error} />
      </fieldset>
    );
  }

  if (field.fieldType === "select") {
    return (
      <label className="event-quote-field">
        <span className="event-quote-label">{label} {field.isRequired ? <RequiredMark /> : null}</span>
        <select className="event-quote-control" name={name} required={field.isRequired} aria-invalid={Boolean(error)} aria-describedby={describedBy} onChange={(event) => onChange(field, event.target.value)}>
          <option value="">{locale === "fr" ? "Choisir" : "Choose"}</option>
          {field.options.map((option) => <option key={option.value} value={option.value}>{optionLabel(option, locale)}</option>)}
        </select>
        <FieldError name={name} error={error} />
      </label>
    );
  }

  if (field.fieldType === "radio") {
    return (
      <fieldset className="event-quote-choice-group event-quote-field--full">
        <legend>{label} {field.isRequired ? <RequiredMark /> : null}</legend>
        <div className="event-quote-option-grid">
          {field.options.map((option) => (
            <label className="event-quote-option-card" key={option.value}>
              <input type="radio" name={name} value={option.value} required={field.isRequired} onChange={() => onChange(field, option.value)} />
              <span>{optionLabel(option, locale)}</span>
            </label>
          ))}
        </div>
        <FieldError name={name} error={error} />
      </fieldset>
    );
  }

  if (field.fieldType === "checkbox_group" || field.fieldType === "multi_select") {
    return (
      <fieldset className="event-quote-choice-group event-quote-field--full">
        <legend>{label} {field.isRequired ? <RequiredMark /> : null}</legend>
        <div className="event-quote-option-grid">
          {field.options.map((option) => (
            <label className="event-quote-option-card" key={option.value}>
              <input
                type="checkbox"
                name={name}
                value={option.value}
                onChange={(event) => {
                  const form = event.currentTarget.form;
                  const values = form ? new FormData(form).getAll(name).map(String) : [];
                  onChange(field, values);
                }}
              />
              <span>{optionLabel(option, locale)}</span>
            </label>
          ))}
        </div>
        <FieldError name={name} error={error} />
      </fieldset>
    );
  }

  return (
    <label className="event-quote-field">
      <span className="event-quote-label">{label} {field.isRequired ? <RequiredMark /> : null}</span>
      <input className="event-quote-control" name={name} required={field.isRequired} aria-invalid={Boolean(error)} aria-describedby={describedBy} onChange={(event) => onChange(field, event.target.value)} />
      <FieldError name={name} error={error} />
    </label>
  );
}
