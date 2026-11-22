"use client";

import { Mail, MessageCircle, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  formatMadagascarPhone,
  getFooterContact,
  getTelephoneHref,
  getWhatsAppHref,
} from "@/lib/contact/footer-contacts";

type FooterContactInfoProps = {
  labels: {
    phone: string;
    whatsapp: string;
    email: string;
  };
};

export function FooterContactInfo({ labels }: FooterContactInfoProps) {
  const pathname = usePathname();
  const contact = getFooterContact(pathname);

  return (
    <div className="footer-contact-list">
      <div className="footer-contact-item">
        <Phone aria-hidden="true" />
        <div>
          <strong>{labels.phone}</strong>
          <a href={getTelephoneHref(contact.phone)}>
            {formatMadagascarPhone(contact.phone)}
          </a>
        </div>
      </div>

      <div className="footer-contact-item">
        <MessageCircle aria-hidden="true" />
        <div>
          <strong>{labels.whatsapp}</strong>
          <a
            href={getWhatsAppHref(contact.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {formatMadagascarPhone(contact.whatsapp)}
          </a>
        </div>
      </div>

      <div className="footer-contact-item">
        <Mail aria-hidden="true" />
        <div>
          <strong>{labels.email}</strong>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </div>
      </div>
    </div>
  );
}
