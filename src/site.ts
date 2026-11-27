// Central site config. Links point at the existing BatchRx app.
// TODO: confirm exact app routes and wire DEMO_ENDPOINT to the real lead inbox / CRM.
export const site = {
  appUrl: 'https://batchrx.com',
  loginUrl: 'https://batchrx.com/login',
  registerUrl: 'https://batchrx.com/register',
  demoEndpoint: import.meta.env.PUBLIC_DEMO_ENDPOINT as string | undefined,
  price: 350,
};

// Price points. The $450 Desktop App keeps zero data on the cloud.
// TODO: confirm with Zee what separates the $250 and $350 plans; the split below is assumed.
export const plans = [
  {
    id: 'platform',
    name: 'Platform',
    price: 250,
    line: 'Every report and audit tool, run by your own team.',
    points: ['Inventory, PBM, billed and aberrant reports', 'BIN search and document vault', 'Data stored securely in the cloud'],
  },
  {
    id: 'specialist',
    name: 'Platform + Specialist',
    price: 350,
    featured: true,
    line: 'The platform, plus a dedicated specialist on every audit.',
    points: ['Everything in Platform', 'A dedicated specialist on every audit', 'Desktop, onsite, CMS and investigative audits'],
  },
  {
    id: 'desktop',
    name: 'Desktop App',
    price: 450,
    line: 'BatchRx installed on your own computer. Zero data on the cloud.',
    points: ['Everything in Platform + Specialist', 'Runs as a desktop application', 'No data stored on the cloud'],
  },
];

export const stats = [
  { value: 50, prefix: '$', suffix: 'M+', label: 'Audit recoupments saved' },
  { value: 13500, suffix: '+', label: 'Audits generated' },
  { value: 400, suffix: '+', label: 'Active pharmacies' },
  { value: 50, suffix: '', label: 'States served' },
];

export const payers = [
  'CVS Caremark',
  'Express Scripts',
  'OptumRx',
  'Prime Therapeutics',
  'MedImpact',
  'Navitus',
  'Elixir',
  'Medicaid',
  'Medicare Part B',
  'NY EPIC',
];

export const pmsSystems = ['PrimeRx', 'Pioneer', 'Datascan', 'DigitalRx', 'BestRx', 'Liberty'];

export const wholesalers = [
  'Kinray',
  'McKesson',
  'AmerisourceBergen',
  'Real Value',
  'TopRx',
  'Alpine Health',
  'AXIA',
  'Smart Source',
  'CityMed',
  'DrugZone',
  'KeySource',
  'Masters',
  'Smith Drugs',
  'Parmed',
  'Akron',
];

export const testimonials = [
  {
    quote:
      'BatchRx is a game-changer for my 12-pharmacy network! I can oversee all locations from one screen.',
    name: 'David',
    place: 'NY State Pharmacy Group',
    featured: true,
  },
  {
    quote:
      'BatchRx transformed our audit workflow. The platform is intuitive, making it easy to stay on top of compliance. We’ve saved time and avoided costly errors.',
    name: 'Miriam',
    place: 'Brooklyn Pharmacy',
  },
  {
    quote:
      'Managing audits with BatchRx has been a game changer. The tools are efficient and user-friendly, helping us prevent recoupments and maintain accurate records effortlessly.',
    name: 'Mike',
    place: 'Queens Pharmacy',
  },
  {
    quote:
      'BatchRx simplifies our entire audit process. It’s incredibly straightforward to use, and the peace of mind knowing we’re compliant is invaluable. A must-have for any pharmacy.',
    name: 'Eli',
    place: 'Manhattan Pharmacy',
  },
];
