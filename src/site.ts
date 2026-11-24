// Central site config. Links point at the existing BatchRx app.
// TODO: confirm exact app routes and wire DEMO_ENDPOINT to the real lead inbox / CRM.
export const site = {
  appUrl: 'https://batchrx.com',
  loginUrl: 'https://batchrx.com/login',
  registerUrl: 'https://batchrx.com/register',
  demoEndpoint: import.meta.env.PUBLIC_DEMO_ENDPOINT as string | undefined,
  price: 350,
};

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
