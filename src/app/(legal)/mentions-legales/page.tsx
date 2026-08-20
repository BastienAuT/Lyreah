import { getLegalConfiguration } from "@/site/config";
import {
  isLegalConfigurationComplete,
  isNonProfessionalIndividualPublisher,
} from "@/site/legal-configuration";
import { createPublicPageMetadata } from "@/site/metadata";
import styles from "../legal.module.css";

export const metadata = createPublicPageMetadata({
  title: "Mentions légales",
  description:
    "Informations relatives à l’édition, à l’hébergement et à l’utilisation du site Lyreah.",
  path: "/mentions-legales",
});

function PendingValue({ children }: { children: string }) {
  return <span className={styles.pending}>{children}</span>;
}

export default function LegalNoticesPage() {
  const legal = getLegalConfiguration();
  const isNonProfessionalIndividual =
    isNonProfessionalIndividualPublisher(legal);
  const isIncomplete = !isLegalConfigurationComplete(legal);

  return (
    <article className={styles.article}>
      <header>
        <p className={styles.eyebrow}>Informations du site</p>
        <h1>Mentions légales</h1>
        <p className={styles.intro}>
          Les informations ci-dessous identifient les responsables de Lyreah et
          précisent les principales conditions d’utilisation du site.
        </p>
        <p className={styles.updated}>Dernière mise à jour : 20 août 2026.</p>
        {isIncomplete ? (
          <p className={styles.notice} role="status">
            Version de développement : la configuration légale doit encore être
            complétée ou confirmée avant la mise en production.
          </p>
        ) : null}
      </header>

      <nav aria-label="Sommaire des mentions légales">
        <ul className={styles.toc}>
          <li><a href="#edition">Édition</a></li>
          <li><a href="#hebergement">Hébergement</a></li>
          <li><a href="#propriete">Propriété intellectuelle</a></li>
          <li><a href="#responsabilite">Responsabilité</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <section className={styles.section} id="edition">
        <h2>Édition et publication</h2>
        <address>
          <strong>Éditeur et directeur de la publication :</strong>{" "}
          {legal.publisherName ?? (
            <PendingValue>identité à renseigner</PendingValue>
          )}
          <br />
          <strong>Statut :</strong>{" "}
          {isNonProfessionalIndividual
            ? "personne physique éditant à titre non professionnel"
            : legal.publisherStatus === "professional"
              ? "éditeur professionnel"
              : <PendingValue>statut à renseigner</PendingValue>}
          <br />
          {isNonProfessionalIndividual ? (
            <>
              <strong>Adresse personnelle :</strong>{" "}
              non publiée dans le cadre du régime applicable aux éditeurs non
              professionnels
              <br />
            </>
          ) : (
            <>
              <strong>Adresse :</strong>{" "}
              {legal.publisherAddress ?? (
                <PendingValue>adresse à renseigner</PendingValue>
              )}
              <br />
            </>
          )}
          <strong>Contact :</strong>{" "}
          {legal.contactEmail ? (
            <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
          ) : (
            <PendingValue>adresse électronique à renseigner</PendingValue>
          )}
        </address>
        {isNonProfessionalIndividual ? (
          <p>
            {legal.hostIdentityConfirmed ? (
              <>
                Les éléments d’identification personnelle requis ont été
                communiqués à l’hébergeur.
              </>
            ) : (
              <PendingValue>
                La communication des éléments d’identification personnelle à
                l’hébergeur doit être confirmée avant publication.
              </PendingValue>
            )}
          </p>
        ) : null}
      </section>

      <section className={styles.section} id="hebergement">
        <h2>Hébergement</h2>
        <address>
          <strong>Hébergeur :</strong>{" "}
          {legal.hostName ?? <PendingValue>raison sociale à renseigner</PendingValue>}
          <br />
          <strong>Adresse :</strong>{" "}
          {legal.hostAddress ?? <PendingValue>adresse à renseigner</PendingValue>}
          <br />
          <strong>Contact :</strong>{" "}
          {legal.hostContact ?? <PendingValue>coordonnées à renseigner</PendingValue>}
        </address>
      </section>

      <section className={styles.section} id="propriete">
        <h2>Propriété intellectuelle</h2>
        <p>
          La marque, l’interface, les textes éditoriaux et les créations visuelles
          propres à Lyreah ne peuvent pas être réutilisés sans autorisation. Les
          livres proposés sont issus du domaine public ou d’une licence compatible ;
          leur source et leurs droits sont indiqués sur chaque fiche.
        </p>
      </section>

      <section className={styles.section} id="responsabilite">
        <h2>Responsabilité</h2>
        <p>
          Lyreah veille à fournir des informations exactes et un service disponible,
          sans pouvoir garantir l’absence permanente d’erreur ou d’interruption. Les
          liens vers des services tiers sont fournis à titre informatif ; leurs
          contenus et leurs pratiques restent sous la responsabilité de leurs éditeurs.
        </p>
      </section>

      <section className={styles.section} id="contact">
        <h2>Contact</h2>
        <p>
          Pour toute question sur le site, son contenu ou vos données personnelles,
          écrivez à{" "}
          {legal.contactEmail ? (
            <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
          ) : (
            <PendingValue>l’adresse de contact à renseigner avant publication</PendingValue>
          )}
          .
        </p>
      </section>
    </article>
  );
}
