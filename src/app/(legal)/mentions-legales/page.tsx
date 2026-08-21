import Link from "next/link";
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

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

function ExternalContact({ value }: { value: string }) {
  const url = parseHttpUrl(value);

  if (url) {
    return (
      <a href={url.href} rel="noreferrer">
        {url.hostname}
      </a>
    );
  }

  return <>{value}</>;
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
        <p className={styles.updated}>Dernière mise à jour : 21 août 2026.</p>
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
          <li><a href="#donnees">Données personnelles</a></li>
          <li><a href="#droit-applicable">Droit applicable</a></li>
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
          <strong>Téléphone :</strong>{" "}
          {legal.hostPhone ? (
            <a href={`tel:${legal.hostPhone.replace(/[^\d+]/g, "")}`}>
              {legal.hostPhone}
            </a>
          ) : (
            <PendingValue>numéro de téléphone à renseigner</PendingValue>
          )}
          <br />
          <strong>Site et assistance :</strong>{" "}
          {legal.hostContact ? (
            <ExternalContact value={legal.hostContact} />
          ) : (
            <PendingValue>coordonnées à renseigner</PendingValue>
          )}
        </address>
      </section>

      <section className={styles.section} id="propriete">
        <h2>Propriété intellectuelle</h2>
        <p>
          La structure du site, la marque Lyreah, son interface, ses textes
          éditoriaux et ses créations visuelles sont protégés par le droit de la
          propriété intellectuelle. Sauf exception prévue par la loi ou autorisation
          écrite préalable, toute reproduction, adaptation ou diffusion, même
          partielle, est interdite.
        </p>
        <p>
          Les livres proposés sont issus du domaine public ou diffusés sous une
          licence compatible. Leur source, leurs crédits et les droits applicables
          sont indiqués sur chaque fiche. Les marques et contenus appartenant à des
          tiers restent la propriété de leurs titulaires respectifs.
        </p>
      </section>

      <section className={styles.section} id="responsabilite">
        <h2>Responsabilité</h2>
        <p>
          Lyreah s’efforce de fournir des informations exactes, à jour et un service
          accessible. Le site peut néanmoins être interrompu pour maintenance,
          incident technique ou cas de force majeure. L’éditeur ne peut garantir
          l’absence permanente d’erreur, ni être tenu responsable d’un dommage
          résultant d’un usage contraire à la destination du service, dans les limites
          permises par la loi.
        </p>
        <p>
          Les liens externes sont proposés à titre informatif. Lyreah ne contrôle ni
          la disponibilité, ni les contenus, ni les pratiques des sites tiers, qui
          restent sous la responsabilité de leurs éditeurs. La création d’un lien
          simple vers Lyreah est autorisée sous réserve de ne pas créer de confusion
          sur l’origine du contenu ni d’intégrer une page du site dans un cadre tiers.
        </p>
      </section>

      <section className={styles.section} id="donnees">
        <h2>Données personnelles et traceurs</h2>
        <p>
          Les traitements liés au compte, à la bibliothèque et à la progression de
          lecture, ainsi que les modalités d’exercice de vos droits, sont décrits dans
          la <Link href="/politique-de-confidentialite">politique de confidentialité</Link>.
          Lyreah utilise uniquement les cookies et stockages locaux nécessaires à
          l’authentification, à la sécurité et aux préférences de lecture ; aucun
          traceur publicitaire n’est déposé.
        </p>
      </section>

      <section className={styles.section} id="droit-applicable">
        <h2>Droit applicable et droit de réponse</h2>
        <p>
          Le site et les présentes mentions sont soumis au droit français. Tout
          différend relève des juridictions compétentes selon les règles de droit
          commun, après recherche, lorsque cela est possible, d’une solution amiable.
        </p>
        <p>
          Toute personne nommée ou désignée sur le site dispose d’un droit de réponse
          dans les conditions prévues par l’article 1-1 de la loi du 21 juin 2004 pour
          la confiance dans l’économie numérique. La demande peut être adressée au
          contact ci-dessous ou, lorsque l’éditeur conserve l’anonymat, à l’hébergeur.
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
