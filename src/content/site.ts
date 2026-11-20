/**
 * All page copy for the SGI Phase 1 website lives here, so it can be reviewed
 * and edited in one place. Components never hard-code copy.
 *
 * Sources: the approved line, brand idea, structure, roles, voice and proof
 * come from SGI Marketing Foundations (16 Nov 2026) as corrected at the
 * 16 Nov brand strategy review (450+ placements replaces 350+). Anything
 * marked `status: 'pending'` or flagged in `signOffs` must not go live until
 * it is approved; `npm run check:release` lists every open item.
 *
 * Voice: assured, plain-spoken, personal and accountable. Short, specific
 * sentences. No hype, jargon, sales-floor terms, or income or job promises.
 */

export type Accent = 'deep' | 'electric' | 'sky';

export interface Business {
  /** Used for in-page anchors: #business-<id>. */
  id: 'institute' | 'sales' | 'pathways';
  name: string;
  /** Approved one-line role. */
  role: string;
  /** Supporting sentence (draft, part of the homepage copy sign-off). */
  summary: string;
  /** Brand colour assigned to this business in the SGI palette. */
  accent: Accent;
}

export interface ProofPoint {
  id: string;
  value: string;
  label: string;
  /** Only `approved` points are rendered. */
  status: 'approved' | 'pending';
  /** Where the figure comes from and any qualification it needs. */
  source: string;
}

export const brand = {
  name: 'Summit Group International',
  shortName: 'SGI',
} as const;

export const meta = {
  title: 'Summit Group International | One relationship. Three specialists.',
  description:
    'We recruit, develop and manage South African talent that takes your business higher. One relationship with SGI, backed by three specialist businesses.',
} as const;

export const cta = {
  label: 'Book a conversation',
} as const;

export const navigation = [
  { label: 'About', href: '#about' },
  { label: 'Our businesses', href: '#businesses' },
  { label: 'How we work', href: '#how-we-work' },
  { label: 'Who we work with', href: '#who-we-work-with' },
] as const;

export const hero = {
  /** Approved 13-word promise. Do not edit without a newer approved source. */
  headline: 'We recruit, develop and manage South African talent that takes your business higher.',
  support: 'One relationship with Summit Group International. Three specialist businesses behind it.',
  destinationsLabel: 'Our three specialist businesses',
} as const;

export const businesses: readonly Business[] = [
  {
    id: 'institute',
    name: 'Summit Institute',
    role: 'Develops skills',
    summary: 'Training that prepares people for the work your business needs done.',
    accent: 'deep',
  },
  {
    id: 'sales',
    name: 'Summit Sales',
    role: 'Manages and coaches sales teams',
    summary: 'Day-to-day management and coaching for the sales teams you rely on.',
    accent: 'electric',
  },
  {
    id: 'pathways',
    // "Pathways" is a working name: see signOffs.pathwaysName.
    name: 'Summit Pathways',
    role: 'Recruits and places talent',
    summary: 'Finds and places South African talent in the roles you need to fill.',
    accent: 'sky',
  },
];

export const about = {
  eyebrow: 'About SGI',
  heading: 'One group. One point of contact.',
  body: 'Summit Group International brings three specialist businesses together: Summit Institute, Summit Sales and Summit Pathways. Companies and partners work with SGI, and we bring in the specialists your business needs.',
  proofLabel: 'SGI in numbers',
} as const;

export const proof: readonly ProofPoint[] = [
  {
    id: 'placements',
    value: '450+',
    label: 'placements since June 2025',
    status: 'approved',
    source:
      'Corrected figure from the 16 Nov 2026 brand strategy review (replaces 350+). Confirm against the updated stats before launch.',
  },
  {
    id: 'point-of-contact',
    value: '1',
    label: 'point of contact for every client',
    status: 'approved',
    source: 'SGI Marketing Foundations, proof slide. Group-level: the point of contact is SGI.',
  },
  {
    id: 'specialists',
    value: '3',
    label: 'specialist businesses in one group',
    status: 'approved',
    source: 'Approved group structure: Summit Institute, Summit Sales, Summit Pathways.',
  },
  {
    id: 'client-result',
    value: '$1.5m',
    label:
      'a month: the largest monthly revenue of a client our teams helped scale. Not SGI revenue, not a typical result and not a guarantee.',
    status: 'pending',
    source:
      'Retained "pending better data" at the 16 Nov review. The exact current wording has not been verified, so it stays unpublished.',
  },
];

export const businessesSection = {
  eyebrow: 'Our businesses',
  heading: 'One relationship. Three specialists.',
  intro: 'SGI looks after the relationship. Each specialist business focuses on one part of the work.',
  talentNote:
    'Looking for training or a role? Our specialist businesses work with individuals directly. SGI works with companies and partners.',
} as const;

export const howWeWork = {
  eyebrow: 'How we work',
  heading: 'From one conversation to the right specialists.',
  steps: [
    {
      title: 'A conversation',
      body: 'Tell us what your business needs. You speak to SGI, not three separate companies.',
    },
    {
      title: 'The right specialists',
      body: 'We bring in Summit Institute, Summit Sales, Summit Pathways or a combination, depending on what you need.',
    },
    {
      title: 'Summit-Ready',
      body: 'Our standard: people are trained, tested and supported before they reach you.',
    },
    {
      title: 'One point of contact',
      body: 'SGI stays your point of contact while the work goes on.',
    },
  ],
} as const;

export const audiences = {
  eyebrow: 'Who we work with',
  heading: 'For South African companies, international clients and partners.',
  groups: [
    {
      title: 'South African corporates and banks',
      body: 'One accountable group to recruit, develop and manage the people your business depends on.',
    },
    {
      title: 'International clients',
      body: 'Access to South African talent through one group, with one point of contact from the first conversation.',
    },
    {
      title: 'Partners and funders',
      body: 'One group to work with on developing and placing South African talent.',
    },
  ],
} as const;

export const closing = {
  eyebrow: 'Book a conversation',
  heading: 'Start with a conversation.',
  body: 'Tell us what your business needs, and we will bring in the right specialists.',
  /** Shown instead of the button until PUBLIC_BOOKING_URL is configured. */
  pendingNotice: 'Pre-launch placeholder: the booking button appears here once its destination is approved.',
} as const;

export const footer = {
  summary: 'Summit Group International brings together Summit Institute, Summit Sales and Summit Pathways.',
  /** Brand name only. The registered entity name is not confirmed yet. */
  copyrightHolder: 'Summit Group International',
} as const;

/**
 * Pre-publication sign-offs. Flip an item to `true` only once it has been
 * approved in writing; `npm run check:release` fails while any is false.
 */
export const signOffs = {
  /** All homepage copy in this file, including the drafted supporting sentences. */
  homepageCopy: false,
  /** "Summit Pathways" is a working name. */
  pathwaysName: false,
  /** Exact wording and scope of "450+ placements since June 2025". */
  placementsFigure: false,
  /** Registered company name for the footer, and whether a privacy notice is needed. */
  legalDetails: false,
};
