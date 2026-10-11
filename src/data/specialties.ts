import { SpecialtyMeta } from '../types/index.ts';

export const SPECIALTIES: SpecialtyMeta[] = [
  { name: 'General Physician', code: 'GEN', description: 'Primary care, fevers, seasonal infections & preventive health checkups', iconName: 'Stethoscope', typicalFeeRange: '₹100 - ₹200' },
  { name: 'Cardiologist', code: 'CARD', description: 'Heart health, hypertension, ECG evaluation & cardiovascular monitoring', iconName: 'HeartPulse', typicalFeeRange: '₹250 - ₹400' },
  { name: 'Dermatologist', code: 'DERM', description: 'Skin ailments, hair fall, allergies, acne & cosmetic consultations', iconName: 'Sparkles', typicalFeeRange: '₹200 - ₹350' },
  { name: 'Neurologist', code: 'NEUR', description: 'Brain, migraines, nerve disorders, spine & neuro-rehabilitation', iconName: 'Brain', typicalFeeRange: '₹300 - ₹450' },
  { name: 'Orthopedic Doctor', code: 'ORTH', description: 'Joint pain, fractures, arthritis, bone density & sports injuries', iconName: 'Bone', typicalFeeRange: '₹200 - ₹380' },
  { name: 'Pediatrician', code: 'PED', description: 'Newborn care, child immunization, growth milestones & viral care', iconName: 'Baby', typicalFeeRange: '₹150 - ₹250' },
  { name: 'Gynecologist', code: 'OBGYN', description: 'Women health, prenatal care, PCOS, fertility & wellness screenings', iconName: 'Flower2', typicalFeeRange: '₹200 - ₹350' },
  { name: 'ENT Specialist', code: 'ENT', description: 'Ear infections, sinusitis, throat irritation, hearing & tonsillitis', iconName: 'Headphones', typicalFeeRange: '₹150 - ₹300' },
  { name: 'Ophthalmologist', code: 'OPHT', description: 'Eye exams, cataracts, vision correction, glaucoma & screen strain', iconName: 'Eye', typicalFeeRange: '₹150 - ₹280' },
  { name: 'Dentist', code: 'DENT', description: 'Dental cleaning, cavities, root canal consultations & gum hygiene', iconName: 'Smile', typicalFeeRange: '₹150 - ₹300' },
  { name: 'Psychiatrist', code: 'PSYC', description: 'Mental wellness, anxiety, sleep disorders, stress & therapy advice', iconName: 'SmilePlus', typicalFeeRange: '₹250 - ₹400' },
  { name: 'Pulmonologist', code: 'PULM', description: 'Asthma, chronic cough, respiratory allergies & lung assessments', iconName: 'Wind', typicalFeeRange: '₹200 - ₹350' },
  { name: 'Gastroenterologist', code: 'GAST', description: 'Digestion, acid reflux, liver function, IBS & abdominal health', iconName: 'ShieldAlert', typicalFeeRange: '₹250 - ₹400' },
  { name: 'Endocrinologist', code: 'ENDO', description: 'Diabetes management, thyroid disorders & hormonal balance', iconName: 'Activity', typicalFeeRange: '₹250 - ₹380' },
  { name: 'Nephrologist', code: 'NEPH', description: 'Kidney care, renal function, dialysis guidance & urinary health', iconName: 'Droplets', typicalFeeRange: '₹280 - ₹450' },
  { name: 'Urologist', code: 'UROL', description: 'Urinary tract, bladder health, kidney stones & prostate checkups', iconName: 'Cross', typicalFeeRange: '₹250 - ₹400' },
  { name: 'Oncologist', code: 'ONC', description: 'Cancer screenings, chemotherapy guidance, tumor evaluations & support', iconName: 'ShieldCheck', typicalFeeRange: '₹300 - ₹500' },
  { name: 'Physiotherapist', code: 'PHYS', description: 'Post-op rehabilitation, mobility recovery, posture & muscular therapy', iconName: 'Accessibility', typicalFeeRange: '₹120 - ₹250' },
];

export const STANDARD_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];
