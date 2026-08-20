export interface ServiceGroup {
  category: string;
  color: "red" | "pink" | "blue" | "purple" | "amber" | "slate";
  services: string[];
}

// Curated for what Ugandan hospitals commonly offer, from the district hospital
// level up to referral hospitals. Colors are solid, no gradients, grouped so a
// long list stays scannable.
export const HOSPITAL_SERVICE_GROUPS: ServiceGroup[] = [
  {
    category: "Emergency & critical care",
    color: "red",
    services: ["Emergency / A&E", "Intensive Care Unit (ICU)", "Ambulance / referral", "Trauma & surgery"],
  },
  {
    category: "Maternal & child health",
    color: "pink",
    services: [
      "Maternity & delivery", "Antenatal care", "Postnatal care", "Family planning",
      "Immunization", "Paediatrics", "Newborn / NICU care",
    ],
  },
  {
    category: "Diagnostics",
    color: "blue",
    services: ["Laboratory services", "Radiology & imaging", "Ultrasound", "Blood bank / transfusion", "Pathology"],
  },
  {
    category: "Specialist care",
    color: "purple",
    services: [
      "General surgery", "Orthopaedics", "Dentistry", "Ophthalmology / eye care", "ENT",
      "Cardiology", "Dermatology", "Urology", "Gynaecology",
    ],
  },
  {
    category: "Chronic & public health",
    color: "amber",
    services: [
      "HIV/AIDS care & ART", "TB treatment", "Malaria treatment", "Diabetes & hypertension clinic",
      "Mental health services", "Nutrition counselling",
    ],
  },
  {
    category: "General & outpatient",
    color: "slate",
    services: ["Outpatient consultation", "Physiotherapy", "Pharmacy", "Dialysis", "Minor theatre / procedures"],
  },
];

export const PHARMACY_SERVICE_GROUPS: ServiceGroup[] = [
  {
    category: "Dispensing",
    color: "blue",
    services: ["Prescription dispensing", "Over-the-counter medicine", "Home delivery"],
  },
  {
    category: "Testing & screening",
    color: "amber",
    services: ["Blood pressure check", "Blood sugar testing", "HIV testing", "Malaria testing"],
  },
  {
    category: "Maternal & family",
    color: "pink",
    services: ["Family planning products", "Baby & maternal products", "Vaccination / immunization"],
  },
  {
    category: "General",
    color: "slate",
    services: ["Health consultation", "Wound care / first aid", "Cosmetics & personal care"],
  },
];

export const SERVICE_COLOR_CLASSES: Record<ServiceGroup["color"], { chip: string; selected: string }> = {
  red: {
    chip: "border-red-200 bg-red-50 text-red-700 hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300",
    selected: "border-red-500 bg-red-600 text-white dark:border-red-500 dark:bg-red-600",
  },
  pink: {
    chip: "border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-300 dark:border-pink-900/40 dark:bg-pink-950/30 dark:text-pink-300",
    selected: "border-pink-500 bg-pink-600 text-white dark:border-pink-500 dark:bg-pink-600",
  },
  blue: {
    chip: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300",
    selected: "border-blue-500 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600",
  },
  purple: {
    chip: "border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-300",
    selected: "border-purple-500 bg-purple-600 text-white dark:border-purple-500 dark:bg-purple-600",
  },
  amber: {
    chip: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
    selected: "border-amber-500 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-600",
  },
  slate: {
    chip: "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300",
    selected: "border-slate-600 bg-slate-700 text-white dark:border-slate-500 dark:bg-slate-600",
  },
};
