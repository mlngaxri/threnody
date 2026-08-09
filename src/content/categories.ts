import type { Category, Contributor, SiteConfig } from "../lib/types.ts";

/**
 * Taxonomy, contributors and site configuration.
 * Stored as data so new entries and sections need no component changes.
 */

export const categories: Category[] = [
  {
    id: "extinct-voices",
    name: "Extinct Voices",
    slug: "extinct-voices",
    tagline: "Animals whose calls ended with them.",
    description:
      "Every species that vocalised carried a signature no other species could produce. When the last individual died, that signature left the world permanently. This section holds the ones we can still partially recover, from tape, from notation, or from the physics of a preserved syrinx.",
    accent: "amber",
    order: 1,
  },
  {
    id: "silenced-places",
    name: "Silenced Places",
    slug: "silenced-places",
    tagline: "Landscapes that stopped sounding like themselves.",
    description:
      "A place has an acoustic fingerprint built from its water, its wind shear, its vegetation density and its animals. Drain the sea, fell the canopy or pour the concrete and the fingerprint is gone even though the coordinates remain. These are recordings of geography that no longer answers to its own name.",
    accent: "cyan",
    order: 2,
  },
  {
    id: "obsolete-machines",
    name: "Obsolete Machines",
    slug: "obsolete-machines",
    tagline: "Industrial sound rendered unnecessary by progress.",
    description:
      "Machines announce themselves. For roughly a century the soundtrack of ordinary life was mechanical, and then within two decades most of it went quiet or went digital. These entries preserve the working noises that entire professions organised their days around.",
    accent: "orange",
    order: 3,
  },
  {
    id: "vanished-rituals",
    name: "Vanished Rituals",
    slug: "vanished-rituals",
    tagline: "Human practices that carried their own acoustics.",
    description:
      "Ritual is repetition, and repetition produces sound. When a practice is outlawed, abandoned or simply forgotten by the generation that would have inherited it, the sound is the first part to go, because it was never written down.",
    accent: "violet",
    order: 4,
  },
  {
    id: "lost-instruments",
    name: "Lost Instruments",
    slug: "lost-instruments",
    tagline: "Instruments with no surviving player.",
    description:
      "An instrument can survive in a museum case and still be extinct. Without a living performance tradition the object is mute: we have the body but not the technique. These reconstructions are built from physical modelling of the surviving instruments themselves.",
    accent: "rose",
    order: 5,
  },
  {
    id: "atmospheric-ghosts",
    name: "Atmospheric Ghosts",
    slug: "atmospheric-ghosts",
    tagline: "Signals in the air that no longer propagate.",
    description:
      "Some sounds were never made by a body or a machine but by the medium itself, carried on a shortwave band or a particular quality of night air. Change the transmitter, the ionosphere or the ambient noise floor and the signal ceases to exist as a listenable thing.",
    accent: "emerald",
    order: 6,
  },
];

export const contributors: Contributor[] = [
  {
    id: "ada-morrow",
    name: "Dr Ada Morrow",
    role: "Acoustic archaeologist, founding editor",
    affiliation: "THRENODY",
    bio: "Works on the reconstruction of vocalisations from preserved anatomy. Argues that an archive of absent sound must be honest about the difference between what was recorded and what was inferred, and built the fidelity scale used throughout this atlas.",
  },
  {
    id: "kenji-arai",
    name: "Kenji Arai",
    role: "Field recordist",
    affiliation: "Independent",
    bio: "Has spent nineteen years returning to the same forty-one locations with the same microphone placement, producing one of the few longitudinal datasets showing a soundscape thinning year on year.",
  },
  {
    id: "lucia-ferreira",
    name: "Lúcia Ferreira",
    role: "Signal restoration",
    affiliation: "THRENODY",
    bio: "Recovers audio from degraded magnetic tape, lacquer discs and wax cylinders. Treats every restoration as an argument that has to be shown, not a result that can simply be presented.",
  },
  {
    id: "tomas-brandt",
    name: "Tomás Brandt",
    role: "Physical modelling and synthesis",
    affiliation: "THRENODY",
    bio: "Builds the synthesis models behind every reconstructed entry, deriving timbre from instrument geometry and material density rather than imitating it by ear.",
  },
  {
    id: "nour-haddad",
    name: "Nour Haddad",
    role: "Ethnomusicologist",
    affiliation: "Independent",
    bio: "Documents performance traditions in the decade before they end, and is unusually careful to record who declined to be recorded and why.",
  },
  {
    id: "signe-halvorsen",
    name: "Signe Halvorsen",
    role: "Radio and atmospherics",
    affiliation: "THRENODY",
    bio: "Monitors disused frequency allocations. Maintains that the rising global noise floor has quietly destroyed more listenable signal than any single transmitter shutdown.",
  },
];

export const siteConfig: SiteConfig = {
  name: "THRENODY",
  tagline: "An atlas of sounds that no longer exist.",
  description:
    "THRENODY is an acoustic archaeology archive. It maps sounds that have left the world: extinct animal calls, silenced landscapes, obsolete machinery, abandoned rituals, unplayed instruments and dead radio signals. Each one is reconstructed so it can be heard again, and each is labelled plainly with how much of what you hear is evidence and how much is inference.",
  locales: ["en", "fr"],
  defaultLocale: "en",
  socialHandle: "@threnody_atlas",
  featuredSlug: "kauai-oo-final-duet",
  totalEntries: 0, // computed at runtime by the repository
  yearRange: { earliest: 0, latest: 0 }, // computed at runtime
};
