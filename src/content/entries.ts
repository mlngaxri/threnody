import type { Entry } from "../lib/types.ts";

/**
 * The archive. Content lives here, entirely separate from any component, so a
 * new entry becomes a new detail page, a new map pin, a new timeline node and a
 * new set of search results with no component edits at all.
 *
 * Two entries are deliberately left in "draft" status to exercise the
 * draft/publish workflow and the preview mode.
 */

export const entries: Entry[] = [
  {
    id: "e-001",
    slug: "kauai-oo-final-duet",
    title: "The Kauaʻi ʻōʻō's Final Duet",
    epithet: "A mating call answered by nothing",
    description:
      "The last male Kauaʻi ʻōʻō sang a duet that had no second part, because the female half of the species was already gone.",
    body: [
      {
        kind: "paragraph",
        text: "The Kauaʻi ʻōʻō sang in pairs. The male opened with two clear ascending notes and the female closed the phrase, a call-and-response so reliable that recordists used it to count breeding pairs across the Alakaʻi plateau without ever seeing a bird.",
      },
      {
        kind: "paragraph",
        text: "By 1987 the counting was trivial. One male remained. He continued to sing the opening of the duet and then leave the space where the answer belonged, and he did this for an entire season into a forest that had been emptied by avian malaria carried uphill by mosquitoes that warming had allowed to climb.",
      },
      {
        kind: "quote",
        text: "The gap in the recording is not silence. It is the exact shape of the missing bird.",
        attribution: "Dr Ada Morrow, editor's note",
      },
      { kind: "listen", caption: "The opening phrase, with the answering half left unfilled." },
      {
        kind: "paragraph",
        text: "The species was declared extinct in 2000. What survives is a handful of tapes, and the peculiar fact that the most complete record we have of this bird is a recording of it failing to complete itself.",
      },
    ],
    category: "extinct-voices",
    tags: ["birdsong", "hawaii", "duet", "habitat-loss", "1987"],
    fidelity: "field-recording",
    status: "published",
    featured: true,
    order: 1,
    publishedAt: "2026-01-12",
    updatedAt: "2026-05-04",
    contributorIds: ["ada-morrow", "lucia-ferreira"],
    provenance: {
      place: "Alakaʻi Wilderness Preserve",
      region: "Kauaʻi, Hawaiʻi",
      lat: 22.13,
      lon: -159.55,
      lastHeard: 1987,
      firstAttested: 1887,
    },
    sound: {
      baseHz: 1180,
      partials: [1, 2.02, 2.98, 4.1],
      envelope: { attack: 0.02, decay: 0.09, sustain: 0.35, release: 0.4 },
      noise: 0.04,
      durationSec: 3.2,
      description:
        "Two clear flute-like ascending notes, slightly breathy, followed by a pause of equal length where the answering call would have been.",
    },
    sources: [
      { label: "Cornell Lab field tape", detail: "Alakaʻi plateau survey recording", year: 1987 },
      { label: "IUCN Red List assessment", detail: "Moho braccatus declared extinct", year: 2000 },
    ],
    relatedSlugs: ["thylacine-cough", "amazon-dawn-chorus-1979"],
    seo: {
      metaTitle: "The Kauaʻi ʻōʻō's Final Duet | THRENODY",
      metaDescription:
        "The last male Kauaʻi ʻōʻō sang a two-part mating call into an empty forest. A field recording of a species answering itself.",
      ogImageAlt: "A spectrogram showing two bright ascending notes followed by empty bandwidth",
      keywords: ["Kauai oo", "extinct birdsong", "Moho braccatus", "acoustic archaeology"],
    },
    readingMinutes: 3,
  },
  {
    id: "e-002",
    slug: "aral-sea-shoreline-1975",
    title: "The Aral Shore at Dusk, 1975",
    epithet: "Forty thousand square kilometres of water noise",
    description:
      "Before the diversion of the Amu Darya, the Aral Sea produced a continuous low surf that residents of Moynaq used to navigate home in the dark.",
    body: [
      {
        kind: "paragraph",
        text: "The Aral was the fourth largest lake on earth and it behaved like a sea, which meant it had surf. A steady onshore wind produced a broadband hiss centred low, punctuated by the slap of water against the hulls of a fishing fleet that employed forty thousand people.",
      },
      {
        kind: "heading", text: "Navigation by ear",
      },
      {
        kind: "paragraph",
        text: "Residents of Moynaq described walking home at night by keeping the surf on a particular side. It was not folklore; it was a usable acoustic gradient that extended several kilometres inland across flat ground.",
      },
      {
        kind: "paragraph",
        text: "The water began retreating in the 1960s and by 2014 the eastern basin was dry. Moynaq is now roughly one hundred and fifty kilometres from any water. The fishing boats are still there, upright on sand, and the dominant sound is wind moving over salt flats: a thinner, higher, entirely different signal.",
      },
      { kind: "figure", caption: "The Moynaq ship cemetery.", alt: "Rusted fishing trawlers resting on dry salt flats" },
    ],
    category: "silenced-places",
    tags: ["water", "central-asia", "irrigation", "surf", "1975"],
    fidelity: "reconstructed",
    status: "published",
    featured: true,
    order: 2,
    publishedAt: "2026-01-28",
    updatedAt: "2026-04-19",
    contributorIds: ["kenji-arai", "tomas-brandt"],
    provenance: {
      place: "Moynaq",
      region: "Karakalpakstan, Uzbekistan",
      lat: 43.77,
      lon: 59.03,
      lastHeard: 1985,
      firstAttested: null,
    },
    sound: {
      baseHz: 90,
      partials: [1, 1.6, 2.4, 3.7, 5.5],
      envelope: { attack: 1.4, decay: 0.8, sustain: 0.8, release: 2.2 },
      noise: 0.82,
      durationSec: 8,
      description:
        "A slow broadband wash rising and falling roughly every nine seconds, weighted toward low frequencies, with intermittent wooden knocking from moored hulls.",
    },
    sources: [
      { label: "Soviet hydrological survey", detail: "Aral basin water level records", year: 1975 },
      { label: "Oral history interviews", detail: "Moynaq residents, collected 2018", year: 2018 },
    ],
    relatedSlugs: ["amazon-dawn-chorus-1979", "glacier-calving-ok"],
    seo: {
      metaTitle: "The Aral Shore at Dusk, 1975 | THRENODY",
      metaDescription:
        "A reconstruction of the surf of the Aral Sea, a sound that guided people home before the water was diverted away.",
      ogImageAlt: "Rusted trawlers on a dry seabed under a pale sky",
      keywords: ["Aral Sea", "Moynaq", "soundscape", "environmental collapse"],
    },
    readingMinutes: 4,
  },
  {
    id: "e-003",
    slug: "dial-up-handshake",
    title: "The Dial-Up Handshake",
    epithet: "Two modems negotiating in public",
    description:
      "For fifteen years the sound of a computer connecting to another computer was audible by design, and then it was engineered away.",
    body: [
      {
        kind: "paragraph",
        text: "The handshake was never meant to be music. It was a negotiation performed out loud: a dial tone, DTMF digits, an answering carrier, then a rapid exchange in which two modems probed the line and agreed on the fastest scheme it could carry.",
      },
      {
        kind: "heading", text: "Why you could hear it" },
      {
        kind: "paragraph",
        text: "The speaker was left on deliberately. A user needed to know whether the line was busy, whether a human had answered by mistake, and whether the negotiation had failed. The sound was a diagnostic interface delivered through the only output device guaranteed to be present.",
      },
      {
        kind: "quote",
        text: "It is the only widely loved sound in computing history that existed purely as an error-reporting mechanism.",
        attribution: "Tomás Brandt",
      },
      { kind: "listen", caption: "A V.34 negotiation, compressed to nine seconds." },
      {
        kind: "paragraph",
        text: "Always-on broadband removed both the negotiation and the reason to hear it. The sound did not degrade or become rare. It became structurally impossible, which is a cleaner kind of extinction than most entries in this archive get.",
      },
    ],
    category: "obsolete-machines",
    tags: ["telecoms", "modem", "1990s", "protocol", "domestic"],
    fidelity: "field-recording",
    status: "published",
    featured: false,
    order: 3,
    publishedAt: "2026-02-09",
    updatedAt: "2026-02-09",
    contributorIds: ["tomas-brandt"],
    provenance: {
      place: "Domestic telephone lines",
      region: "Worldwide",
      lat: 51.5,
      lon: -0.12,
      lastHeard: 2007,
      firstAttested: 1981,
    },
    sound: {
      baseHz: 1800,
      partials: [1, 1.33, 1.78, 2.4, 3.1],
      envelope: { attack: 0.005, decay: 0.05, sustain: 0.7, release: 0.08 },
      noise: 0.45,
      durationSec: 9,
      description:
        "A steady dial tone, seven tone-pairs, then a two-tone carrier answered by rapid scrambling noise that resolves into a smooth hiss.",
    },
    sources: [
      { label: "ITU-T V.34 recommendation", detail: "Modem negotiation sequence specification", year: 1994 },
      { label: "Domestic line recording", detail: "56k connection captured on cassette", year: 1998 },
    ],
    relatedSlugs: ["linotype-hot-metal", "shipping-forecast-long-wave"],
    seo: {
      metaTitle: "The Dial-Up Handshake | THRENODY",
      metaDescription:
        "The modem handshake was an error-reporting interface that a generation learned by heart. Why it sounded the way it did, and why it cannot return.",
      ogImageAlt: "A spectrogram of a modem negotiation resolving into flat carrier noise",
      keywords: ["dial-up", "modem", "V.34", "obsolete technology sound"],
    },
    readingMinutes: 4,
  },
  {
    id: "e-004",
    slug: "linotype-hot-metal",
    title: "The Linotype Floor",
    epithet: "Ninety operators casting language into lead",
    description:
      "A newspaper composing room ran at a volume that required its own sign language, and the machine that caused it was retired almost overnight.",
    body: [
      {
        kind: "paragraph",
        text: "A Linotype assembled a line of text from falling brass matrices, cast it in molten lead, then returned every matrix to its magazine by means of a notched distributor bar. Each of those stages made a distinct noise, and a large composing room ran ninety machines at once.",
      },
      {
        kind: "paragraph",
        text: "The result was not a roar but a texture: a continuous rain of small metallic clicks with a slower rhythm of casting thumps underneath, and the smell of hot lead that operators insisted you could hear coming.",
      },
      {
        kind: "heading", text: "A room that needed hand signals" },
      {
        kind: "paragraph",
        text: "Composing rooms developed their own gestural vocabulary because speech was not reliable across the floor. When phototypesetting arrived, the rooms went quiet within about five years, and the gestures went with them.",
      },
    ],
    category: "obsolete-machines",
    tags: ["printing", "industrial", "lead", "newspapers", "1970s"],
    fidelity: "restored",
    status: "published",
    featured: false,
    order: 4,
    publishedAt: "2026-02-22",
    updatedAt: "2026-03-30",
    contributorIds: ["lucia-ferreira", "kenji-arai"],
    provenance: {
      place: "Composing rooms",
      region: "New York, United States",
      lat: 40.75,
      lon: -73.99,
      lastHeard: 1978,
      firstAttested: 1886,
    },
    sound: {
      baseHz: 210,
      partials: [1, 2.7, 4.3, 6.9, 9.2],
      envelope: { attack: 0.001, decay: 0.06, sustain: 0.12, release: 0.15 },
      noise: 0.55,
      durationSec: 7,
      description:
        "Dense irregular metallic clicking at roughly nine events per second, over a slower cycle of heavy mechanical thumps every two seconds.",
    },
    sources: [
      { label: "Mergenthaler Linotype manual", detail: "Model 31 operation and maintenance", year: 1959 },
      { label: "Composing room tape", detail: "Restored quarter-inch reel", year: 1974 },
    ],
    relatedSlugs: ["dial-up-handshake", "pneumatic-tube-exchange"],
    seo: {
      metaTitle: "The Linotype Floor | THRENODY",
      metaDescription:
        "Ninety Linotype machines casting lead produced a sound so dense that composing rooms invented their own sign language.",
      ogImageAlt: "Rows of Linotype machines in a newspaper composing room",
      keywords: ["Linotype", "hot metal typesetting", "industrial sound", "printing history"],
    },
    readingMinutes: 3,
  },
  {
    id: "e-005",
    slug: "amazon-dawn-chorus-1979",
    title: "Dawn Chorus, Rondônia, 1979",
    epithet: "A soundscape with no unoccupied frequency",
    description:
      "A single 1979 recording shows every frequency band occupied by a different species. The same coordinates recorded today have audible gaps.",
    body: [
      {
        kind: "paragraph",
        text: "The acoustic niche hypothesis holds that in a mature tropical forest, species partition the frequency spectrum in the same way they partition physical territory. Two species that call in the same band at the same hour cannot both be heard, so evolution separates them.",
      },
      {
        kind: "paragraph",
        text: "The 1979 Rondônia tape is one of the cleanest demonstrations of this ever captured. Plotted as a spectrogram it shows almost no unoccupied bandwidth between roughly two hundred hertz and twelve kilohertz for the full duration of dawn.",
      },
      {
        kind: "quote",
        text: "You do not need to identify a single species to see that something has been removed. You can see the holes.",
        attribution: "Kenji Arai",
      },
      {
        kind: "paragraph",
        text: "Returning to the same coordinates with the same microphone placement produces a spectrogram with visible vacancies. The forest is still there in the satellite image. The spectrum says otherwise.",
      },
      { kind: "listen", caption: "Sixty seconds of the 1979 chorus, band-limited for comparison." },
    ],
    category: "silenced-places",
    tags: ["rainforest", "biodiversity", "spectrogram", "brazil", "1979"],
    fidelity: "restored",
    status: "published",
    featured: true,
    order: 5,
    publishedAt: "2026-03-05",
    updatedAt: "2026-06-11",
    contributorIds: ["kenji-arai", "ada-morrow"],
    provenance: {
      place: "Rondônia",
      region: "Brazil",
      lat: -10.83,
      lon: -63.34,
      lastHeard: 1979,
      firstAttested: null,
    },
    sound: {
      baseHz: 640,
      partials: [1, 1.9, 3.2, 5.1, 7.8, 11.4],
      envelope: { attack: 0.3, decay: 0.4, sustain: 0.75, release: 1.1 },
      noise: 0.35,
      durationSec: 10,
      description:
        "A dense overlapping chorus with insect stridulation high in the spectrum, frogs low, and bird calls threaded between, with no silent band.",
    },
    sources: [
      { label: "Field tape, Rondônia transect", detail: "Restored from degraded reel", year: 1979 },
      { label: "Acoustic niche hypothesis", detail: "Spectral partitioning in tropical soundscapes", year: 1993 },
    ],
    relatedSlugs: ["kauai-oo-final-duet", "aral-sea-shoreline-1975"],
    seo: {
      metaTitle: "Dawn Chorus, Rondônia, 1979 | THRENODY",
      metaDescription:
        "A 1979 Amazon recording with no unoccupied frequency band, compared against the visible gaps in the same location today.",
      ogImageAlt: "A dense spectrogram fully occupied from 200Hz to 12kHz",
      keywords: ["dawn chorus", "acoustic niche", "Amazon", "biodiversity loss"],
    },
    readingMinutes: 5,
  },
  {
    id: "e-006",
    slug: "shipping-forecast-long-wave",
    title: "Long Wave, 198 kHz",
    epithet: "A ritual disguised as a weather bulletin",
    description:
      "The shipping forecast on long wave had a fixed cadence, a fixed vocabulary and a carrier hiss that no digital replacement reproduces.",
    body: [
      {
        kind: "paragraph",
        text: "The forecast is a compressed language: sea area, wind direction and force, weather, visibility, always in that order, read at a pace fixed by the need to be transcribed by hand on a moving vessel.",
      },
      {
        kind: "heading", text: "The carrier is part of the text" },
      {
        kind: "paragraph",
        text: "On long wave the signal arrives with a specific hiss, a slow fade as the ionosphere shifts, and a bandwidth so narrow that the voice is stripped of everything above about four and a half kilohertz. Listeners describe the result as intimate, which is an artefact of the transmission and not of the reading.",
      },
      {
        kind: "paragraph",
        text: "Heard on a clean digital stream, the same words in the same order do not produce the same effect. The ritual survives; its acoustics did not.",
      },
    ],
    category: "atmospheric-ghosts",
    tags: ["radio", "long-wave", "maritime", "broadcast", "ritual"],
    fidelity: "restored",
    status: "published",
    featured: false,
    order: 6,
    publishedAt: "2026-03-18",
    updatedAt: "2026-05-27",
    contributorIds: ["signe-halvorsen", "lucia-ferreira"],
    provenance: {
      place: "Droitwich transmitting station",
      region: "United Kingdom",
      lat: 52.29,
      lon: -2.13,
      lastHeard: 2024,
      firstAttested: 1924,
    },
    sound: {
      baseHz: 240,
      partials: [1, 2, 3, 4.2],
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.5 },
      noise: 0.5,
      durationSec: 9,
      description:
        "A band-limited male voice under a steady hiss, with a slow amplitude fade cycling every eleven seconds and occasional static crackle.",
    },
    sources: [
      { label: "Long wave off-air recording", detail: "198 kHz, captured on domestic receiver", year: 1996 },
      { label: "Maritime broadcast schedule", detail: "Sea area bulletin format", year: 1949 },
    ],
    relatedSlugs: ["numbers-station-lincolnshire", "dial-up-handshake"],
    seo: {
      metaTitle: "Long Wave, 198 kHz | THRENODY",
      metaDescription:
        "The shipping forecast's intimacy was an artefact of long wave transmission. What was lost when the carrier went away.",
      ogImageAlt: "A long wave radio dial illuminated in a dark room",
      keywords: ["shipping forecast", "long wave", "198 kHz", "radio history"],
    },
    readingMinutes: 3,
  },
  {
    id: "e-007",
    slug: "numbers-station-lincolnshire",
    title: "The Lincolnshire Poacher",
    epithet: "A folk melody used to address no one in particular",
    description:
      "A shortwave numbers station opened every transmission with bars of an English folk tune, then read five-figure groups to an audience it never acknowledged.",
    body: [
      {
        kind: "paragraph",
        text: "The station broadcast from the eastern Mediterranean for roughly two decades. Each transmission opened with the same handful of bars of an English folk melody, repeated until the hour, and then a synthesised female voice read groups of five digits for around forty-five minutes.",
      },
      {
        kind: "paragraph",
        text: "Nothing about it was ever officially confirmed, and nothing about it needed to be. A one-time pad broadcast in the clear is secure precisely because it is public, and the melody existed only so an operator could confirm they had found the right frequency.",
      },
      {
        kind: "quote",
        text: "It is the most heavily listened-to broadcast in history that was aimed at a single person.",
        attribution: "Signe Halvorsen",
      },
      {
        kind: "paragraph",
        text: "Transmissions ceased in 2008. The frequency is now occupied by nothing in particular, which on shortwave means it is occupied by the rising global noise floor.",
      },
    ],
    category: "atmospheric-ghosts",
    tags: ["shortwave", "numbers-station", "cryptography", "cold-war", "2008"],
    fidelity: "field-recording",
    status: "published",
    featured: false,
    order: 7,
    publishedAt: "2026-04-02",
    updatedAt: "2026-04-02",
    contributorIds: ["signe-halvorsen"],
    provenance: {
      place: "Eastern Mediterranean",
      region: "Unconfirmed",
      lat: 34.58,
      lon: 32.99,
      lastHeard: 2008,
      firstAttested: 1988,
    },
    sound: {
      baseHz: 523,
      partials: [1, 2, 3.01, 4.02],
      envelope: { attack: 0.01, decay: 0.12, sustain: 0.5, release: 0.25 },
      noise: 0.3,
      durationSec: 7,
      description:
        "A simple repeating melodic phrase in a thin synthesised timbre, under shortwave static, followed by evenly spaced spoken digits.",
    },
    sources: [
      { label: "Shortwave monitoring logs", detail: "Frequency and schedule records", year: 2004 },
      { label: "Off-air recording", detail: "Captured on communications receiver", year: 2001 },
    ],
    relatedSlugs: ["shipping-forecast-long-wave", "dial-up-handshake"],
    seo: {
      metaTitle: "The Lincolnshire Poacher | THRENODY",
      metaDescription:
        "A shortwave numbers station that opened with a folk melody and read five-figure groups to an audience of one.",
      ogImageAlt: "A communications receiver tuned to an empty shortwave band",
      keywords: ["numbers station", "Lincolnshire Poacher", "shortwave", "one-time pad"],
    },
    readingMinutes: 4,
  },
  {
    id: "e-008",
    slug: "thylacine-cough",
    title: "The Thylacine's Cough",
    epithet: "A bark described by everyone and recorded by no one",
    description:
      "Every account of the thylacine mentions a double coughing bark. No audio was ever captured, so this entry is an honest speculation built from anatomy.",
    body: [
      {
        kind: "paragraph",
        text: "Trappers, zookeepers and naturalists all describe the same thing: a dry, double-noted cough, repeated at intervals, quieter than a dog and with no growl beneath it. The consistency of the descriptions across sixty years is unusual and worth taking seriously.",
      },
      {
        kind: "heading", text: "What a reconstruction can and cannot claim" },
      {
        kind: "paragraph",
        text: "Preserved specimens allow the vocal tract length and larynx geometry to be measured, which constrains the plausible fundamental frequency and formant structure. That is genuine physical evidence. It does not tell us the rhythm, the amplitude envelope or the emotional range, all of which come from written description.",
      },
      {
        kind: "quote",
        text: "We publish this at the lowest fidelity grade on purpose. A speculative reconstruction presented confidently would be worse than silence.",
        attribution: "Dr Ada Morrow",
      },
      {
        kind: "paragraph",
        text: "The last known animal died at Beaumaris Zoo on the night of 7 September 1936, shut out of its sheltered enclosure during a cold snap. Film of that animal exists and runs to roughly sixty seconds. It is silent. A sound camera was never pointed at a thylacine, and by the time anyone thought to try, there was nothing left to point one at. The species was granted official protection fifty-nine days before the last one died.",
      },
      {
        kind: "note",
        text: "Everything you can hear in this entry is inference. We have modelled the vocal tract from three preserved specimens, bounded the fundamental frequency by larynx geometry, and taken the two-note rhythm from written testimony alone. If a recording is ever found in an uncatalogued collection, this reconstruction should be replaced within the day and marked as superseded rather than quietly corrected.",
      },
      { kind: "listen", caption: "Speculative reconstruction. Not a recording." },
    ],
    category: "extinct-voices",
    tags: ["marsupial", "tasmania", "speculative", "anatomy", "1936"],
    fidelity: "speculative",
    status: "published",
    featured: false,
    order: 8,
    publishedAt: "2026-04-16",
    updatedAt: "2026-06-30",
    contributorIds: ["ada-morrow", "tomas-brandt"],
    provenance: {
      place: "Beaumaris Zoo, Hobart",
      region: "Tasmania, Australia",
      lat: -42.88,
      lon: 147.33,
      lastHeard: 1936,
      firstAttested: 1805,
    },
    sound: {
      baseHz: 320,
      partials: [1, 1.5, 2.3, 3.4, 4.8],
      envelope: { attack: 0.004, decay: 0.11, sustain: 0.05, release: 0.18 },
      noise: 0.38,
      durationSec: 4,
      description:
        "Two short dry barks about four hundred milliseconds apart, mid-pitched and breathy with no growl, repeating after a two-second gap.",
    },
    sources: [
      { label: "Keeper accounts, Beaumaris Zoo", detail: "Contemporary written descriptions", year: 1933 },
      { label: "Specimen morphometrics", detail: "Vocal tract measurement of preserved material", year: 2011 },
    ],
    relatedSlugs: ["kauai-oo-final-duet", "moa-bone-flute"],
    seo: {
      metaTitle: "The Thylacine's Cough | THRENODY",
      metaDescription:
        "No recording of a thylacine exists. A speculative reconstruction built from vocal tract anatomy, published at the lowest fidelity grade.",
      ogImageAlt: "An archival photograph of a thylacine in a zoo enclosure",
      keywords: ["thylacine", "Tasmanian tiger", "extinct animal sound", "reconstruction"],
    },
    readingMinutes: 4,
  },
  {
    id: "e-009",
    slug: "pneumatic-tube-exchange",
    title: "The Pneumatic Tube Exchange",
    epithet: "A city that moved paper at forty kilometres an hour",
    description:
      "Beneath several major cities, compressed air carried written messages through iron tubes, arriving with a sound every clerk could identify blindfolded.",
    body: [
      {
        kind: "paragraph",
        text: "A pneumatic despatch network moved sealed felt-wrapped carriers through iron pipes using pressure differential. Paris ran two hundred and sixty-seven kilometres of it. A message crossed the city in under half an hour, which was faster than any alternative until the fax.",
      },
      {
        kind: "paragraph",
        text: "The arrival was unmistakable: a rising hiss as the carrier displaced air ahead of itself, then a hard thump into the receiving basket, then the pressure equalising with a descending sigh. Clerks judged the sending station by the pitch of the approach.",
      },
      {
        kind: "paragraph",
        text: "The Paris network closed in 1984. Short runs survive inside hospitals and banks, but a single tube produces a fundamentally different sound to a network, in the way a single voice differs from a crowd.",
      },
      {
        kind: "quote",
        text: "You did not hear one tube. You heard the building breathing, and you learned to read it.",
        attribution: "Retired sorting clerk, Bourse station, interviewed 1983",
      },
      {
        kind: "note",
        text: "This reconstruction is graded reconstructed rather than field recording. A surviving carrier and a preserved section of tube were measured directly, which fixes the bore resonance and the impact spectrum with real confidence. The density of the network, meaning how many arrivals overlapped in a busy hall, is taken from staffing records and timetables rather than from audio. That layering is the inferred part.",
      },
    ],
    category: "obsolete-machines",
    tags: ["pneumatic", "paris", "infrastructure", "post", "1984"],
    fidelity: "reconstructed",
    status: "published",
    featured: false,
    order: 9,
    publishedAt: "2026-05-01",
    updatedAt: "2026-05-01",
    contributorIds: ["tomas-brandt", "lucia-ferreira"],
    provenance: {
      place: "Réseau pneumatique",
      region: "Paris, France",
      lat: 48.86,
      lon: 2.35,
      lastHeard: 1984,
      firstAttested: 1866,
    },
    sound: {
      baseHz: 150,
      partials: [1, 2.1, 3.6, 5.2],
      envelope: { attack: 0.9, decay: 0.05, sustain: 0.2, release: 1.6 },
      noise: 0.7,
      durationSec: 6,
      description:
        "A rising airy hiss over about two seconds, a single hard thump, then a falling sigh as pressure equalises.",
    },
    sources: [
      { label: "Administration des Postes technical record", detail: "Réseau pneumatique network plan", year: 1934 },
      { label: "Preserved carrier and tube section", detail: "Physical modelling reference", year: 2019 },
    ],
    relatedSlugs: ["linotype-hot-metal", "dial-up-handshake"],
    seo: {
      metaTitle: "The Pneumatic Tube Exchange | THRENODY",
      metaDescription:
        "Paris moved letters through 267 kilometres of iron pipe on compressed air. The sound of a carrier arriving, reconstructed.",
      ogImageAlt: "A brass pneumatic tube receiving station with felt-wrapped carriers",
      keywords: ["pneumatic post", "réseau pneumatique", "Paris", "obsolete infrastructure"],
    },
    readingMinutes: 3,
  },
  {
    id: "e-010",
    slug: "moa-bone-flute",
    title: "The Moa Bone Kōauau",
    epithet: "An instrument whose material went extinct first",
    description:
      "Some kōauau were made from moa bone. When the moa went, the specific resonance of those instruments became unrepeatable.",
    body: [
      {
        kind: "paragraph",
        text: "The kōauau is a short cross-blown flute. Surviving examples are made from wood, stone, whale ivory and bird bone, and a small number are made from moa bone, which is denser and thicker-walled than any bird bone available today.",
      },
      {
        kind: "heading", text: "Material as timbre" },
      {
        kind: "paragraph",
        text: "Wall density and bore geometry determine how much energy leaves through the tube wall rather than the finger holes. A denser wall keeps more energy inside, producing a brighter, more sustained tone with stronger upper partials. This is measurable and it is why a replica in modern bone does not sound the same.",
      },
      {
        kind: "paragraph",
        text: "Surviving instruments are taonga and are not played. The reconstruction here is derived from published measurements of bore and wall thickness, not from performance, and is offered with that limitation stated.",
      },
    ],
    category: "lost-instruments",
    tags: ["taonga-puoro", "aotearoa", "physical-modelling", "bone", "flute"],
    fidelity: "reconstructed",
    status: "published",
    featured: false,
    order: 10,
    publishedAt: "2026-05-20",
    updatedAt: "2026-07-08",
    contributorIds: ["nour-haddad", "tomas-brandt"],
    provenance: {
      place: "Te Waipounamu",
      region: "Aotearoa New Zealand",
      lat: -43.53,
      lon: 172.63,
      lastHeard: 1500,
      firstAttested: 1300,
    },
    sound: {
      baseHz: 740,
      partials: [1, 2, 3, 4, 5.1],
      envelope: { attack: 0.06, decay: 0.15, sustain: 0.65, release: 0.5 },
      noise: 0.22,
      durationSec: 6,
      description:
        "A breathy cross-blown flute tone, bright and sustained, with audible air noise at the blowing edge and gentle pitch inflection.",
    },
    sources: [
      { label: "Museum morphometric survey", detail: "Bore and wall thickness measurements", year: 2007 },
      { label: "Taonga pūoro scholarship", detail: "Materials and construction traditions", year: 1996 },
    ],
    relatedSlugs: ["thylacine-cough", "gamelan-tuning-drift"],
    seo: {
      metaTitle: "The Moa Bone Kōauau | THRENODY",
      metaDescription:
        "Some kōauau were made from moa bone. A physical-modelling reconstruction of an instrument whose raw material is extinct.",
      ogImageAlt: "A short bone flute resting on dark cloth",
      keywords: ["kōauau", "taonga pūoro", "moa bone", "lost instrument"],
    },
    readingMinutes: 4,
  },
  {
    id: "e-011",
    slug: "gamelan-tuning-drift",
    title: "One Gamelan, One Tuning",
    epithet: "Ensembles deliberately tuned to be incompatible",
    description:
      "Every gamelan was tuned to itself, so no two ensembles could exchange instruments. Standardisation is quietly erasing that.",
    body: [
      {
        kind: "paragraph",
        text: "A gamelan is tuned as a single object. The intervals of sléndro and pélog are not fixed ratios but a family of tunings, and each smith set an ensemble's character within that family. Two gamelan from neighbouring villages were audibly different and could not lend each other instruments.",
      },
      {
        kind: "paragraph",
        text: "Paired ensembles were also tuned slightly apart on purpose, so that struck together they produce ombak, a slow beating that is heard as the ensemble breathing rather than as an error.",
      },
      {
        kind: "quote",
        text: "The tuning was the ensemble's name. Standardise it and you have not improved the instrument, you have anonymised it.",
        attribution: "Nour Haddad",
      },
      {
        kind: "paragraph",
        text: "Institutional demand for interchangeable, electronically-tuned sets is narrowing the range. The tradition is healthy; the variance is not.",
      },
    ],
    category: "vanished-rituals",
    tags: ["gamelan", "java", "tuning", "ombak", "standardisation"],
    fidelity: "field-recording",
    status: "published",
    featured: false,
    order: 11,
    publishedAt: "2026-06-14",
    updatedAt: "2026-06-14",
    contributorIds: ["nour-haddad", "kenji-arai"],
    provenance: {
      place: "Surakarta",
      region: "Central Java, Indonesia",
      lat: -7.56,
      lon: 110.83,
      lastHeard: 2019,
      firstAttested: 1157,
    },
    sound: {
      baseHz: 296,
      partials: [1, 2.34, 3.61, 5.12, 6.9],
      envelope: { attack: 0.003, decay: 0.5, sustain: 0.3, release: 3.4 },
      noise: 0.08,
      durationSec: 9,
      description:
        "Struck bronze with inharmonic partials and a long shimmering decay, two instances slightly detuned so the combined tone pulses slowly.",
    },
    sources: [
      { label: "Tuning measurements, Surakarta ensembles", detail: "Cent deviations across paired sets", year: 2015 },
      { label: "Field recording", detail: "Paired sléndro and pélog ensemble", year: 2019 },
    ],
    relatedSlugs: ["moa-bone-flute", "sami-joik-silences"],
    seo: {
      metaTitle: "One Gamelan, One Tuning | THRENODY",
      metaDescription:
        "Every gamelan was tuned to itself, making ensembles deliberately incompatible. Standardisation is erasing that variance.",
      ogImageAlt: "Bronze gamelan keys resting in a carved wooden frame",
      keywords: ["gamelan", "sléndro", "pélog", "ombak", "tuning"],
    },
    readingMinutes: 4,
  },
  {
    id: "e-012",
    slug: "sami-joik-silences",
    title: "The Silences Inside a Joik",
    epithet: "What a suppressed tradition sounds like on return",
    description:
      "A joik is not about its subject, it is the subject. Decades of prohibition left structural gaps that are audible in the form itself.",
    body: [
      {
        kind: "paragraph",
        text: "A joik does not describe a person, a place or an animal. It is understood to be that subject rendered in sound, which is why the grammar is to joik someone rather than to joik about them.",
      },
      {
        kind: "heading", text: "Prohibition leaves a shape" },
      {
        kind: "paragraph",
        text: "Joiking was suppressed for much of the twentieth century, banned in schools across parts of the Nordic region and condemned outright by missionary churches. Transmission is oral and generational, so a break of two generations removes specific joiks permanently while the form survives.",
      },
      {
        kind: "paragraph",
        text: "Contemporary practitioners describe reaching for a family joik and finding only its opening. This entry documents the shape of that absence rather than attempting to fill it, and no reconstruction is offered.",
      },
    ],
    category: "vanished-rituals",
    tags: ["joik", "sapmi", "oral-tradition", "suppression", "transmission"],
    fidelity: "field-recording",
    status: "published",
    featured: false,
    order: 12,
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-21",
    contributorIds: ["nour-haddad", "ada-morrow"],
    provenance: {
      place: "Sápmi",
      region: "Northern Fennoscandia",
      lat: 68.44,
      lon: 22.5,
      lastHeard: 1960,
      firstAttested: 1673,
    },
    sound: {
      baseHz: 196,
      partials: [1, 2, 2.9, 4.1],
      envelope: { attack: 0.08, decay: 0.3, sustain: 0.55, release: 0.9 },
      noise: 0.16,
      durationSec: 8,
      description:
        "An unaccompanied human voice in a short cyclic phrase with wide pitch inflection, breaking off before resolution and leaving a long silence.",
    },
    sources: [
      { label: "Archive recordings, Sápmi", detail: "Pre-prohibition cylinder and tape material", year: 1953 },
      { label: "Oral transmission interviews", detail: "Practitioner accounts of lost family joiks", year: 2021 },
    ],
    relatedSlugs: ["gamelan-tuning-drift", "kauai-oo-final-duet"],
    seo: {
      metaTitle: "The Silences Inside a Joik | THRENODY",
      metaDescription:
        "Decades of prohibition broke the oral transmission of individual joiks. An entry about an absence that is not reconstructed.",
      ogImageAlt: "A wide expanse of northern tundra under low light",
      keywords: ["joik", "Sámi", "oral tradition", "cultural suppression"],
    },
    readingMinutes: 4,
  },
  {
    id: "e-013",
    slug: "glacier-calving-ok",
    title: "Okjökull, Before It Was Demoted",
    epithet: "The sound of ice that still had somewhere to go",
    description:
      "Okjökull lost its glacier status in 2014. A calving glacier and a stagnant ice patch are acoustically unrelated.",
    body: [
      {
        kind: "paragraph",
        text: "Moving ice is loud. It cracks under shear, it releases pressurised meltwater, and it calves with a report that arrives as a low concussion followed by a long tail of water noise.",
      },
      {
        kind: "paragraph",
        text: "Okjökull was declared no longer a glacier in 2014 because it had ceased to move. Dead ice does not crack or calve; it drips. The mass has not entirely gone, but the acoustic behaviour has, and that transition is the thing this entry records.",
      },
      {
        kind: "heading",
        text: "Why a stagnant ice patch is quiet",
      },
      {
        kind: "paragraph",
        text: "Nearly every loud thing a glacier does is a consequence of motion. Shear against bedrock fractures the ice and each fracture radiates a broadband crack. Meltwater under pressure forces channels open and drains with a sustained roar. Calving requires a terminus advancing into somewhere it can fall. Remove the movement and all three mechanisms stop at once. What is left is surface melt, which is quiet, high in frequency, and almost entirely local: you have to stand on it to hear anything at all.",
      },
      {
        kind: "paragraph",
        text: "In 2019 a memorial plaque was fixed to the bare rock, addressed to the next two hundred years and stating that we knew what was happening and what needed to be done. It is the only monument we are aware of that commemorates a sound as much as a landform, although it does not put it that way.",
      },
      {
        kind: "note",
        text: "Graded reconstructed. Okjökull itself was never recorded while it was still active, so the acoustic model is built from calving and shear recordings at comparable Icelandic outlet glaciers, then scaled to Okjökull's surveyed thickness and slope. The physics is well constrained. The specific voice of this particular glacier is not, and never can be.",
      },
    ],
    category: "silenced-places",
    tags: ["glacier", "iceland", "climate", "ice", "2014"],
    fidelity: "reconstructed",
    status: "draft",
    featured: false,
    order: 13,
    publishedAt: "2026-08-15",
    updatedAt: "2026-08-01",
    contributorIds: ["kenji-arai"],
    provenance: {
      place: "Okjökull",
      region: "Iceland",
      lat: 64.6,
      lon: -20.99,
      lastHeard: 2014,
      firstAttested: null,
    },
    sound: {
      baseHz: 55,
      partials: [1, 1.4, 2.2, 3.9],
      envelope: { attack: 0.002, decay: 1.2, sustain: 0.15, release: 4 },
      noise: 0.6,
      durationSec: 10,
      description:
        "A sharp deep concussion followed by a long descending rumble and several seconds of turbulent water.",
    },
    sources: [
      { label: "Glaciological survey", detail: "Okjökull status reassessment", year: 2014 },
      {
        label: "Comparative calving recordings",
        detail: "Hydrophone and airborne arrays at Icelandic outlet glaciers, used as the acoustic model basis",
        year: 2018,
      },
      {
        label: "Ok memorial plaque, A letter to the future",
        detail: "Installed on the bare rock in August 2019",
        year: 2019,
      },
    ],
    relatedSlugs: ["aral-sea-shoreline-1975"],
    seo: {
      metaTitle: "Okjökull, Before It Was Demoted | THRENODY",
      metaDescription:
        "Okjökull stopped being a glacier in 2014. The acoustic difference between moving ice and dead ice.",
      ogImageAlt: "A bare volcanic slope where a glacier once sat",
      keywords: ["Okjökull", "glacier", "Iceland", "climate change"],
    },
    readingMinutes: 2,
  },
  {
    id: "e-014",
    slug: "trans-atlantic-cable-tap",
    title: "The Cable Room",
    epithet: "Morse arriving from under an ocean",
    description:
      "Early transatlantic cable signals were so faint that operators read them from a mirror galvanometer in near-total silence.",
    body: [
      {
        kind: "paragraph",
        text: "The first working transatlantic cables carried a signal too weak to drive a sounder. Operators read a spot of light reflected from a mirror galvanometer, in darkened rooms kept quiet so that nobody's footsteps would disturb the instrument.",
      },
      {
        kind: "paragraph",
        text: "The cable room's sound was therefore mostly its own suppression: the siphon recorder's pen, the clock, and the deliberate absence of everything else. Amplification made the silence unnecessary within a generation.",
      },
      {
        kind: "note",
        text: "No audio of a mirror galvanometer cable room was ever recorded. The technology was obsolete before portable recording existed, so nothing here is a document of a real sound. What you hear is a speculative reconstruction, inferred from the surviving instruments in the Porthcurno and Valentia collections, from the measured stroke rate of a siphon recorder, and from written accounts of the working conditions. Treat it as an informed argument about a room, not as evidence of one.",
      },
      {
        kind: "paragraph",
        text: "The reconstruction sets a pendulum clock at the far wall, a siphon recorder pen at close range, and a floor that answers a footstep the way a boarded Victorian station floor would. Every one of those choices is a judgement. We have marked the entry speculative so that it can never be mistaken for a recording, and we would rather be corrected than believed.",
      },
    ],
    category: "obsolete-machines",
    tags: ["telegraph", "cable", "morse", "victorian", "silence"],
    fidelity: "speculative",
    status: "draft",
    featured: false,
    order: 14,
    publishedAt: "2026-09-01",
    updatedAt: "2026-08-02",
    contributorIds: ["lucia-ferreira", "tomas-brandt"],
    provenance: {
      place: "Valentia Island cable station",
      region: "Ireland",
      lat: 51.92,
      lon: -10.35,
      lastHeard: 1920,
      firstAttested: 1866,
    },
    sound: {
      baseHz: 1000,
      partials: [1, 3, 5],
      envelope: { attack: 0.001, decay: 0.02, sustain: 0.3, release: 0.04 },
      noise: 0.12,
      durationSec: 6,
      description:
        "A very quiet scratching pen tracing irregular marks, a slow clock tick, and long stretches of room tone.",
    },
    sources: [
      { label: "Cable station operating records", detail: "Valentia Island procedures", year: 1871 },
      {
        label: "Preserved siphon recorder and mirror galvanometer",
        detail: "Instrument geometry and pen stroke rate measured from the surviving apparatus",
        year: 2016,
      },
      {
        label: "Operator testimony, collected accounts",
        detail: "Written descriptions of working conditions and enforced quiet in the cable room",
        year: 1893,
      },
    ],
    relatedSlugs: ["pneumatic-tube-exchange", "linotype-hot-metal"],
    seo: {
      metaTitle: "The Cable Room | THRENODY",
      metaDescription:
        "Transatlantic cable signals were read by mirror galvanometer in enforced silence. The sound of a room built to have none.",
      ogImageAlt: "A Victorian siphon recorder tracing ink onto a paper tape",
      keywords: ["transatlantic cable", "telegraph", "mirror galvanometer", "Valentia"],
    },
    readingMinutes: 2,
  },
];
