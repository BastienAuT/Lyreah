import Link from "next/link";
import { getLegalConfiguration } from "@/site/config";
import { createPublicPageMetadata } from "@/site/metadata";
import styles from "../legal.module.css";

export const metadata = createPublicPageMetadata({
  title: "Politique de confidentialité",
  description:
    "Comment Lyreah collecte, utilise et protège les données nécessaires à votre compte et à votre lecture.",
  path: "/politique-de-confidentialite",
});

export default function PrivacyPolicyPage() {
  const legal = getLegalConfiguration();

  return (
    <article className={styles.article}>
      <header>
        <p className={styles.eyebrow}>Vos données</p>
        <h1>Politique de confidentialité</h1>
        <p className={styles.intro}>
          Lyreah ne collecte que les informations nécessaires au compte, à la
          synchronisation de la bibliothèque et au fonctionnement sécurisé de la
          liseuse.
        </p>
        <p className={styles.updated}>Dernière mise à jour : 20 août 2026.</p>
      </header>

      <nav aria-label="Sommaire de la politique de confidentialité">
        <ul className={styles.toc}>
          <li><a href="#responsable">Responsable</a></li>
          <li><a href="#donnees">Données traitées</a></li>
          <li><a href="#finalites">Finalités</a></li>
          <li><a href="#prestataires">Prestataires</a></li>
          <li><a href="#conservation">Conservation</a></li>
          <li><a href="#droits">Vos droits</a></li>
        </ul>
      </nav>

      <section className={styles.section} id="responsable">
        <h2>Responsable du traitement</h2>
        <p>
          Le responsable est{" "}
          {legal.publisherName ?? (
            <span className={styles.pending}>l’éditeur à renseigner avant publication</span>
          )}
          . Vous pouvez le contacter à{" "}
          {legal.contactEmail ? (
            <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
          ) : (
            <span className={styles.pending}>
              l’adresse électronique à renseigner avant publication
            </span>
          )}
          . Les informations relatives à l’édition figurent dans les{" "}
          <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </section>

      <section className={styles.section} id="donnees">
        <h2>Données traitées</h2>
        <ul>
          <li>identité de compte : adresse électronique, nom affiché et identifiant ;</li>
          <li>données d’authentification et de session gérées par Neon Auth ;</li>
          <li>livres enregistrés, état de lecture et position de reprise ;</li>
          <li>préférences de liseuse et d’ambiance sonore ;</li>
          <li>données techniques strictement nécessaires à la sécurité et au diagnostic.</li>
        </ul>
        <p>
          Lyreah ne demande aucune donnée de paiement et n’utilise pas les contenus
          de lecture pour établir un profil publicitaire.
        </p>
      </section>

      <section className={styles.section} id="finalites">
        <h2>Finalités et bases juridiques</h2>
        <p>
          Les données de compte, de bibliothèque et de progression sont traitées pour
          fournir le service demandé et synchroniser votre expérience. Les données
          techniques sont traitées dans l’intérêt légitime de sécuriser, maintenir et
          améliorer le service. Aucun message commercial n’est envoyé sans accord
          distinct.
        </p>
      </section>

      <section className={styles.section} id="prestataires">
        <h2>Prestataires et localisation</h2>
        <p>Lyreah s’appuie notamment sur :</p>
        <ul>
          <li>Neon pour la base de données et l’authentification ;</li>
          <li>Supabase pour le stockage privé des fichiers de lecture et des sons ;</li>
          <li>
            {legal.hostName ?? "l’hébergeur indiqué dans les mentions légales"} pour
            servir l’application.
          </li>
        </ul>
        <p>
          Ces prestataires traitent les données nécessaires à leur mission selon leurs
          propres garanties contractuelles. Certains traitements peuvent impliquer un
          transfert hors de l’Espace économique européen, encadré par les mécanismes
          prévus par la réglementation applicable.
        </p>
      </section>

      <section className={styles.section} id="cookies">
        <h2>Cookies et stockage local</h2>
        <p>
          Les cookies utilisés servent à maintenir la connexion et à protéger la
          session. Le navigateur peut aussi mémoriser localement les réglages de lecture
          afin de les appliquer sans délai. Lyreah n’installe aucun traceur publicitaire
          ni outil d’analyse marketing.
        </p>
      </section>

      <section className={styles.section} id="conservation">
        <h2>Durée de conservation</h2>
        <p>
          Les informations liées au compte sont conservées tant que celui-ci reste
          actif. Après une demande de suppression validée, les données Lyreah
          associées sont effacées, sous réserve des délais techniques nécessaires à
          la rotation des sauvegardes et des obligations légales éventuelles. Les
          journaux techniques sont conservés pendant une durée limitée,
          proportionnée aux besoins de sécurité.
        </p>
      </section>

      <section className={styles.section} id="droits">
        <h2>Vos droits</h2>
        <p>
          Vous pouvez demander l’accès, la rectification, l’effacement, la limitation
          ou la portabilité de vos données, et vous opposer aux traitements fondés sur
          l’intérêt légitime. Les informations de profil peuvent être rectifiées
          depuis <Link href="/compte/settings">les paramètres du compte</Link>.
        </p>
        <p>
          Pour toute autre demande, contactez{" "}
          {legal.contactEmail ? (
            <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
          ) : (
            <span className={styles.pending}>
              l’adresse indiquée dans les mentions légales une fois configurée
            </span>
          )}
          . Vous pouvez également saisir l’autorité de protection des données compétente.
        </p>
      </section>
    </article>
  );
}
