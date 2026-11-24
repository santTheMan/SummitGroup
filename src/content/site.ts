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

/** The "Our businesses" fold-out lists `businesses`; these are the plain links beside it. */
export const navigation = {
  businessesLabel: 'Our businesses',
  links: [
    { label: 'How we work', href: '#how-we-work' },
    { label: 'Who we work with', href: '#who-we-work-with' },
    { label: 'FAQ', href: '#faq' },
  ],
  menuLabel: 'Menu',
} as const;

export const hero = {
  /** Approved 13-word promise. Do not edit without a newer approved source. */
  headline: 'We recruit, develop and manage South African talent that takes your business higher.',
  /** The word set in the accent colour. Must appear in the headline. */
  accentWord: 'higher.',
  support: 'One relationship with Summit Group International. Three specialist businesses behind it.',
  secondary: { label: 'Our businesses', href: '#businesses' },
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

/** Drafted for the redesign (part of the homepage copy sign-off). `*asterisks*` mark the accent. */
export const about = {
  eyebrow: 'About SGI',
  statement:
    'Building a team is complicated, but it doesn\u2019t need to be fragmented. With *Summit Group International*, you recruit, develop and manage the people your business depends on through one relationship.',
} as const;

/**
 * Client revenue gauge under the statement (Daniel, 22 Nov 2026), after bklit's
 * Gauge chart. The figure is worked out backwards from commissions (Daniel, 24 Nov
 * 2026): SSI's profile reports R12.8m+ in commissions paid to its South African
 * talent in the last 3 months, and setters earn 7.5% of each sale's price, so the
 * sales they made for clients come to R12.8m / 0.075 = R170.7m. In dollars (Daniel
 * asked for dollars, 24 Nov 2026), at R17.5 to the US dollar (the rate on 22 to 23
 * Nov 2026; nearer R16.6 earlier in November, which would give more): about $9.75m.
 * Shown as $9.7M+, rounded down, since R12.8m is itself a floor. Still to be signed
 * off: signOffs.clientRevenueFigure. The 66% fill is decorative.
 */
export const clientRevenue = {
  amount: 9_700_000,
  /** Written around the counting figure: $9.7M+ */
  prefix: '$',
  suffix: '+',
  /** What a screen reader hears */
  spoken: '$9.7 million plus',
  /** Gauge fill, 0 to 100. */
  fill: 66,
  label: 'Revenue generated for clients in the past 3 months',
  /* No "earn", "income" or "commission" in published copy (claims governance, content.test.ts) */
  note: 'Revenue our teams generated for clients, not SGI revenue. Estimated from the sales our talent made in that period.',
  /** Shown as a tag above the label */
  flag: 'Estimate',
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
} as const;

/** Talent note band (approved talent note, split into heading and body). */
export const talentNote = {
  heading: 'Looking for training or a role?',
  body: 'Our specialist businesses work with individuals directly. SGI works with companies and partners.',
  /** Drafted for the redesign (part of the homepage copy sign-off). */
  chooserLabel: 'What are you looking for?',
  options: [
    {
      id: 'training',
      label: 'Training',
      business: 'institute',
      text: 'Summit Institute develops skills: training that prepares people for the work businesses need done.',
      link: 'Meet Summit Institute',
    },
    {
      id: 'role',
      label: 'A role',
      business: 'pathways',
      text: 'Summit Pathways recruits and places talent in the roles companies need to fill.',
      link: 'Meet Summit Pathways',
    },
  ],
} as const;

export const howWeWork = {
  eyebrow: 'How we work',
  heading: 'From one conversation to the *right specialists.*',
  placements: {
    /** Illustrative daily spread of the approved total; see src/lib/placements.ts. */
    from: '2025-06-01',
    to: '2026-11-20',
    heading: 'Placements since June 2025',
    caption: 'Each square is a day. The darker the square, the more people placed that day.',
    note: 'Illustration: an indicative spread of the 450+ placements. Daily figures are not actual records.',
    legendLess: 'Fewer',
    legendMore: 'More',
    /** Phones and tablets show only the most recent weeks, so the squares stay readable
        and the chart never scrolls sideways. */
    phoneWeeks: 20,
    phoneRange: 'Last 20 weeks',
    tabletWeeks: 40,
    tabletRange: 'Last 40 weeks',
    tooltipOne: 'placement',
    tooltipMany: 'placements',
  },
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
  /**
   * "Where we work" map (Daniel, 22 Nov 2026), a dot map after bklit's
   * Choropleth chart and its dot grid. Client markets are Summit Sales'
   * confirmed markets (UK, US, Australia). Ids are ISO 3166-1 numeric, as in
   * world-atlas; `at` is where the label points ([longitude, latitude]).
   */
  markets: {
    caption: 'Our talent is in South Africa. Our international clients are in the United States, the United Kingdom and Australia.',
    home: { id: '710', name: 'South Africa', role: 'Our talent', at: [24, -29] },
    clients: [
      { id: '840', name: 'United States', role: 'Clients', at: [-97, 39] },
      { id: '826', name: 'United Kingdom', role: 'Clients', at: [-2, 53] },
      { id: '036', name: 'Australia', role: 'Clients', at: [134, -25] },
    ],
  },
  groups: [
    {
      title: 'South African corporates and banks',
      body: 'One accountable group to recruit, develop and manage the people your business depends on.',
    },
    {
      title: 'International clients',
      /** The 24/7 line kept from the removed "Covered 24/7" card (22 Nov). */
      body: 'Access to South African talent through one group, with one point of contact from the first conversation. We work 24/7, in line with your needs.',
    },
    {
      title: 'Partners and funders',
      body: 'One group to work with on developing and placing South African talent.',
    },
  ],
} as const;

export const closing = {
  eyebrow: 'Book a conversation',
  heading: 'Start with a *conversation.*',
  body: 'Tell us what your business needs, and we will bring in the right specialists.',
  /** Drafted for the redesign (part of the homepage copy sign-off). */
  needsLabel: 'What do you need?',
  needsHint: 'Optional. Pick any.',
  /** The client only ever deals with SGI, so the picks read as their brief, not as businesses. */
  needs: [
    { id: 'recruit', label: 'Recruit', detail: 'People placed in the roles you need to fill' },
    { id: 'develop', label: 'Develop', detail: 'Training for the work your business needs done' },
    { id: 'manage', label: 'Manage', detail: 'Management and coaching for your sales teams' },
  ],
  /** The "Your brief" card was removed on 22 Nov 2026; its lines now live in the section itself. */
  call: {
    /** Under the needs until something is picked. */
    empty: 'Not sure yet? Book anyway and tell us on the call.',
    /** Under the needs once something is picked. {needs} is filled in by the page. */
    said: 'Your brief: {needs}.',
    /** Set in full ink at the end of the lead: the one-point-of-contact promise. */
    note: 'SGI stays your point of contact while the work goes on.',
    /** Read to screen readers as choices change. {needs} is filled in by the page. */
    summaryEmpty: 'SGI is your one point of contact.',
    summary: 'Your brief: {needs}. SGI is your one point of contact.',
  },
  /** Shown under the button until PUBLIC_BOOKING_URL is configured. */
  pendingNotice: 'Pre-launch placeholder: the booking button appears here once its destination is approved.',
} as const;

/** Drafted for the redesign from approved lines (part of the homepage copy sign-off). */
export const faq = {
  eyebrow: 'FAQ',
  heading: 'Questions, answered',
  intro: 'What companies usually ask before the first conversation.',
  items: [
    {
      q: 'Who does SGI work with?',
      a: 'Companies and partners: South African corporates and banks, international clients, and partners and funders. Individuals looking for training or a role work with our specialist businesses directly.',
    },
    {
      q: 'Do we need to contact each business separately?',
      a: 'No. You speak to SGI. We bring in Summit Institute, Summit Sales, Summit Pathways or a combination, and SGI stays your point of contact while the work goes on.',
    },
    {
      q: 'What does Summit-Ready mean?',
      a: 'It is our standard: people are trained, tested and supported before they reach you.',
    },
    {
      q: 'Do you work with companies outside South Africa?',
      a: 'Yes. International clients reach South African talent through one group, with one point of contact from the first conversation.',
    },
    {
      q: 'How do we start?',
      a: 'Book a conversation. Tell us what your business needs, and we will bring in the right specialists.',
    },
  ],
} as const;

/**
 * Labels for the illustrated product panels (hero panel and the business
 * scenes). They show how working with SGI feels; they are not client data.
 * Every panel carries the `note` label. Drafted for the redesign.
 */
export const illustrations = {
  note: 'Illustration',
  /**
   * The hero tablet (simplified 22 Nov 2026): an example brief, the three things SGI does
   * (closing.needs) and a team of 12 that fills as the tablet scrolls into view. The client's
   * view: SGI is the only contact named.
   */
  panel: {
    workspace: 'Summit Group',
    footer: 'SGI, your one point of contact',
    contact: 'Your contact: SGI',
    briefLabel: 'Example brief',
    briefTitle: 'Grow an outbound sales team',
    teamSize: 12,
    teamLabel: 'people',
    readyLabel: 'Summit-Ready',
    speed: 'Placed in days, not weeks',
    /** Shown on a seat before someone is placed in it. */
    openLabel: 'Open role',
    /**
     * The example team, as profiles on the tablet's seats. INVENTED for the illustration
     * (first name and surname initial only, no photos): not real recruits. Needs a yes
     * before launch, or swap in real Summit-Ready placements with their consent.
     */
    team: [
      { name: 'Lerato K.', role: 'Team lead', city: 'Johannesburg' },
      { name: 'Thandi M.', role: 'Sales rep', city: 'Johannesburg' },
      { name: 'Sipho N.', role: 'Sales rep', city: 'Durban' },
      { name: 'Ayesha P.', role: 'Sales rep', city: 'Cape Town' },
      { name: 'Pieter V.', role: 'Account manager', city: 'Pretoria' },
      { name: 'Naledi D.', role: 'Sales rep', city: 'Johannesburg' },
      { name: 'Kagiso M.', role: 'Sales rep', city: 'Pretoria' },
      { name: 'Zanele B.', role: 'Account manager', city: 'Durban' },
      { name: 'Ruan S.', role: 'Sales rep', city: 'Cape Town' },
      { name: 'Priya G.', role: 'Sales rep', city: 'Durban' },
      { name: 'Musa L.', role: 'Sales rep', city: 'Johannesburg' },
      { name: 'Chloe F.', role: 'Sales rep', city: 'Cape Town' },
    ],
  },
  scenes: {
    institute: {
      title: 'Summit Institute',
      label: 'Your programme',
      gaugeLabel: 'Module 4 of 6',
      next: { label: 'Next', text: 'Practice call' },
      assessment: { label: 'Assessment', text: 'Passed' },
      button: 'Open module',
      chips: ['Trained', 'Tested'],
    },
    sales: {
      title: 'Team report',
      period: 'This week',
      total: 'Team of 12',
      stats: [
        { label: 'Coaching sessions', value: '8' },
        { label: 'Calls reviewed', value: '46' },
        { label: 'Pipeline reviews', value: '3' },
      ],
      chartLabel: 'Coaching sessions, last six weeks',
      chart: [3, 5, 4, 6, 7, 8],
    },
    pathways: {
      title: 'Role brief',
      role: 'Sales development representative',
      button: 'Shortlist',
      steps: ['Brief agreed with SGI', 'Candidates sourced', 'Screened and interviewed', 'Placed and supported'],
      progress: 'of 4 complete',
    },
  },
} as const;

export const footer = {
  summary: 'Summit Group International brings together Summit Institute, Summit Sales and Summit Pathways.',
  columns: {
    businesses: 'Our businesses',
    group: 'SGI',
    start: 'Start',
  },
  groupLinks: [
    { label: 'About', href: '#about' },
    { label: 'How we work', href: '#how-we-work' },
    { label: 'Who we work with', href: '#who-we-work-with' },
    { label: 'FAQ', href: '#faq' },
  ],
  wordmark: 'Summit',
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
  /** The client revenue gauge's amount, period and fill (currently bklit's example values). */
  clientRevenueFigure: false,
};
