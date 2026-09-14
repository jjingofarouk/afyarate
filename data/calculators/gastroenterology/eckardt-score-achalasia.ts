/**
 * Eckardt Score for Achalasia
 * Clinical data file — gastroenterology calculator
 *
 * Original score: Eckardt VF, Aignherr C, Bernhard G. Gastroenterology. 1992;103(6):1732-1738.
 * This file aggregates validated clinical data from peer-reviewed literature.
 */

export const ECKARDT_SCORE_META = {
  slug: "eckardt-score-achalasia",
  title: "Eckardt Score for Achalasia",
  shortTitle: "Eckardt Score",
  specialty: "Gastroenterology",
  specialtySlug: "gastroenterology",
  category: "Motility & Functional GI",
  aliases: [
    "Eckardt score",
    "achalasia severity score",
    "achalasia symptom score",
    "dysphagia score achalasia",
    "achalasia grading scale",
    "achalasia treatment response score",
    "POEM outcome score",
    "Heller myotomy outcome",
    "achalasia remission criteria",
    "achalasia staging",
    "esophageal motility disorder score",
    "esophageal achalasia calculator",
    "regurgitation dysphagia chest pain score",
    "achalasia stage I II III",
    "achalasia clinical scoring",
  ],
  tags: [
    "achalasia",
    "dysphagia",
    "esophageal motility",
    "POEM",
    "Heller myotomy",
    "pneumatic dilation",
    "GI motility",
    "symptom severity",
    "treatment monitoring",
    "endoscopy",
    "manometry",
  ],
  summary:
    "Quantifies symptom severity in achalasia across four cardinal domains to guide treatment decisions and monitor post-intervention response.",
  description:
    "The Eckardt Score is the internationally accepted standard for quantifying symptom burden in patients with achalasia. Developed in 1992 by Eckardt et al., it has become the primary endpoint in landmark trials evaluating pneumatic dilation, laparoscopic Heller myotomy, and per-oral endoscopic myotomy (POEM). A post-treatment Eckardt Score ≤3 defines clinical remission in most published series.",
  lastUpdated: "August 2026",
  evidenceLevel: "Validated clinical scoring tool (Class IIa, expert consensus)",
  clinicalContext:
    "Use in patients with confirmed or suspected achalasia to quantify symptom burden at baseline and assess treatment response. Not a diagnostic tool—always confirm diagnosis with high-resolution manometry (HRM) and/or barium esophagram before initiating treatment.",
};

export type EckardtDomain = "weightLoss" | "dysphagia" | "chestPain" | "regurgitation";

export interface EckardtDomainOption {
  value: number;
  label: string;
  description: string;
}

export interface EckardtDomainDef {
  key: EckardtDomain;
  label: string;
  shortLabel: string;
  description: string;
  clinicalNote: string;
  options: EckardtDomainOption[];
}

export const ECKARDT_DOMAINS: EckardtDomainDef[] = [
  {
    key: "dysphagia",
    label: "Dysphagia",
    shortLabel: "Dysphagia",
    description: "Difficulty swallowing solids or liquids",
    clinicalNote:
      "Dysphagia in achalasia is typically paradoxical (solids and liquids equally affected) due to impaired LES relaxation. Distinguish from oropharyngeal dysphagia, which affects the transfer phase. Ask whether symptoms worsen with stress or cold foods.",
    options: [
      { value: 0, label: "None", description: "No difficulty swallowing" },
      { value: 1, label: "Occasional", description: "Less than daily; patient can eat most foods without consistent difficulty" },
      { value: 2, label: "Daily", description: "Occurs every day but not necessarily with every meal" },
      { value: 3, label: "Each meal", description: "Consistently present with every meal; severely restricts diet" },
    ],
  },
  {
    key: "regurgitation",
    label: "Regurgitation",
    shortLabel: "Regurgitation",
    description: "Return of undigested food or liquid without nausea",
    clinicalNote:
      "Regurgitation in achalasia involves undigested, non-acidic material (retained esophageal content), distinguishing it from GERD. Nocturnal regurgitation increases aspiration risk and may cause chronic pulmonary symptoms.",
    options: [
      { value: 0, label: "None", description: "No regurgitation" },
      { value: 1, label: "Occasional", description: "Less than daily; not predictably associated with meals" },
      { value: 2, label: "Daily", description: "Occurs daily, often postprandial or with recumbency" },
      { value: 3, label: "Each meal", description: "Occurs with virtually every meal; significantly impacts quality of life" },
    ],
  },
  {
    key: "chestPain",
    label: "Retrosternal Chest Pain",
    shortLabel: "Chest Pain",
    description: "Non-cardiac chest pain or pressure behind the sternum",
    clinicalNote:
      "Retrosternal chest pain occurs in 30-60% of achalasia patients, particularly in Type III (spastic) achalasia. It may be triggered by eating or drinking and can mimic angina. Chest pain often improves after successful treatment but may persist even when dysphagia resolves.",
    options: [
      { value: 0, label: "None", description: "No chest pain or pressure" },
      { value: 1, label: "Occasional", description: "Less than daily; does not consistently affect eating behavior" },
      { value: 2, label: "Daily", description: "Occurs daily; may reduce oral intake" },
      { value: 3, label: "Several times/day", description: "Multiple daily episodes; severely limits food and fluid intake" },
    ],
  },
  {
    key: "weightLoss",
    label: "Weight Loss",
    shortLabel: "Weight Loss",
    description: "Unintentional weight loss from baseline",
    clinicalNote:
      "Significant weight loss (>10 kg) is a red-flag feature. Confirm weight loss is unintentional and due to reduced oral intake rather than malignancy, which can cause pseudo-achalasia. Always rule out malignancy at the gastroesophageal junction, particularly in patients >60 years or with rapid symptom onset (<1 year).",
    options: [
      { value: 0, label: "None", description: "Stable body weight" },
      { value: 1, label: "< 5 kg", description: "Mild weight loss; less than 5 kg (11 lbs)" },
      { value: 2, label: "5-10 kg", description: "Moderate weight loss; 5-10 kg (11-22 lbs)" },
      { value: 3, label: "> 10 kg", description: "Severe weight loss; more than 10 kg (22 lbs) — consider pseudo-achalasia" },
    ],
  },
];

export interface EckardtStage {
  stage: string;
  label: string;
  scoreRange: [number, number];
  color: "emerald" | "amber" | "red";
  hexColor: string;
  recommendation: string;
  details: string;
  urgency: "low" | "moderate" | "high" | "critical";
}

export const ECKARDT_STAGES: EckardtStage[] = [
  {
    stage: "Remission",
    label: "Clinical Remission / Stage 0-I",
    scoreRange: [0, 3],
    color: "emerald",
    hexColor: "#059669",
    recommendation:
      "No immediate intervention required. Continue surveillance every 12-24 months with repeat Eckardt scoring and, if clinically indicated, timed barium esophagram (TBE) or high-resolution manometry.",
    details:
      "A score ≤3 is the internationally accepted threshold for clinical remission following treatment of achalasia. For treatment-naive patients, scores of 0-1 represent true remission (Stage 0) and scores of 2-3 represent Stage I disease with mild symptom burden.",
    urgency: "low",
  },
  {
    stage: "Stage II",
    label: "Moderate Disease",
    scoreRange: [4, 6],
    color: "amber",
    hexColor: "#d97706",
    recommendation:
      "Active disease warranting intervention. Discuss therapeutic options: pneumatic dilation (PD), laparoscopic Heller myotomy (LHM) with fundoplication, or per-oral endoscopic myotomy (POEM). Consider HRM subtyping (Chicago Classification) to guide therapy.",
    details:
      "Moderate symptom burden (Stage II, score 4-6) represents clinically significant achalasia. Most guidelines recommend active treatment at this stage. HRM subtype (I, II, or III) influences therapy: POEM shows superiority for Type III (spastic) achalasia.",
    urgency: "moderate",
  },
  {
    stage: "Stage III",
    label: "Severe Disease",
    scoreRange: [7, 12],
    color: "red",
    hexColor: "#dc2626",
    recommendation:
      "Severe symptom burden requiring prompt intervention. Assess nutritional status and aspiration risk. Consider nasogastric or parenteral nutritional support if oral intake is critically compromised. Urgent endoscopic or surgical referral is indicated. Rule out pseudo-achalasia.",
    details:
      "Stage III disease (score >6) represents severe, often debilitating achalasia with high risk of aspiration, malnutrition, and aspiration pneumonia. Significant weight loss mandates exclusion of pseudo-achalasia due to junctional malignancy.",
    urgency: "high",
  },
];

export function getEckardtStage(score: number): EckardtStage {
  return (
    ECKARDT_STAGES.find(
      (s) => score >= s.scoreRange[0] && score <= s.scoreRange[1]
    ) ?? ECKARDT_STAGES[ECKARDT_STAGES.length - 1]
  );
}

export function computeEckardtScore(values: Record<EckardtDomain, number>): number {
  return (
    (values.dysphagia ?? 0) +
    (values.regurgitation ?? 0) +
    (values.chestPain ?? 0) +
    (values.weightLoss ?? 0)
  );
}

export interface TreatmentModality {
  name: string;
  abbreviation: string;
  successRate: string;
  note: string;
}

export const TREATMENT_MODALITIES: TreatmentModality[] = [
  {
    name: "Per-Oral Endoscopic Myotomy",
    abbreviation: "POEM",
    successRate: "90-95%",
    note: "Preferred for Type III (spastic) achalasia and younger patients. Associated with higher GERD rates post-procedure; monitor with pH testing.",
  },
  {
    name: "Laparoscopic Heller Myotomy",
    abbreviation: "LHM",
    successRate: "85-90%",
    note: "Gold standard surgical option. Concurrent partial fundoplication (Dor or Toupet) is recommended to reduce post-operative GERD.",
  },
  {
    name: "Pneumatic Dilation",
    abbreviation: "PD",
    successRate: "70-85%",
    note: "Effective non-surgical option; may require repeated sessions. Best initial choice for elderly or high surgical risk patients.",
  },
  {
    name: "Botulinum Toxin Injection",
    abbreviation: "BTX",
    successRate: "50-65%",
    note: "Short-term efficacy (6-12 months); primarily reserved for frail elderly patients who cannot tolerate more definitive therapy.",
  },
  {
    name: "Calcium Channel Blockers / Nitrates",
    abbreviation: "CCB/Nitrates",
    successRate: "~30-40%",
    note: "Pharmacological bridging therapy only; inferior to endoscopic and surgical options. Used when procedural treatment is unavailable or declined.",
  },
];

export const CLINICAL_PEARLS: string[] = [
  "Achalasia affects approximately 1 per 100,000 person-years; consider the diagnosis in any patient with progressive dysphagia to both solids AND liquids without a structural cause.",
  "The Eckardt Score should be assessed at baseline, immediately post-treatment (4-6 weeks), and at each follow-up visit (typically 6 and 12 months post-procedure, then annually).",
  "A post-treatment Eckardt Score ≤3 is the standard definition of clinical success used in landmark trials (NEJM 2011 PD vs. LHM; JAMA 2019 POEM vs. PD trial; NEJM 2019 POEM vs. LHM trial).",
  "Chest pain often lags behind improvement in dysphagia and regurgitation after treatment—its persistence alone does not indicate treatment failure.",
  "Rapid symptom onset (<12 months duration), age >60, and significant weight loss warrant contrast CT and upper endoscopy to exclude secondary (pseudo) achalasia from junctional malignancy.",
  "Chicago Classification v4.0 (CC4.0) manometric subtyping (Types I, II, III) should guide therapy: Type II responds best to all therapies; Type III achalasia responds best to POEM.",
  "Timed Barium Esophagram (TBE) provides complementary objective assessment of esophageal emptying and is recommended as an adjunct to the Eckardt Score when monitoring treatment response.",
  "Long-standing, untreated achalasia (>10 years) is associated with a modestly elevated risk of esophageal squamous cell carcinoma; periodic endoscopic surveillance may be appropriate.",
];

export interface RedFlag {
  flag: string;
  action: string;
}

export const RED_FLAGS: RedFlag[] = [
  {
    flag: "Rapid symptom onset < 12 months or age > 60 at presentation",
    action: "Rule out pseudo-achalasia: CT chest/abdomen and upper endoscopy with biopsy at the GEJ.",
  },
  {
    flag: "Significant unintentional weight loss > 10 kg",
    action: "Nutritional assessment; exclude malignancy before attributing weight loss to achalasia alone.",
  },
  {
    flag: "Dysphagia primarily to liquids from onset",
    action: "Consider alternative diagnoses: oropharyngeal dysphagia (neurological), esophageal web/ring, or diffuse esophageal spasm.",
  },
  {
    flag: "Hematemesis or frank GI bleeding",
    action: "Urgent endoscopy to exclude structural pathology or Mallory-Weiss tear.",
  },
  {
    flag: "Aspiration events or recurrent pneumonia",
    action: "Assess for aspiration risk; consider nasogastric nutrition and urgent referral for intervention.",
  },
  {
    flag: "Prior esophageal or gastric surgery or caustic ingestion",
    action: "Secondary achalasia / stricture must be excluded with endoscopy and manometry review by a specialist.",
  },
];

export interface ClinicalReference {
  id: string;
  authors: string;
  title: string;
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  url?: string;
  note: string;
}

export const VALIDATED_REFERENCES: ClinicalReference[] = [
  {
    id: "eckardt1992",
    authors: "Eckardt VF, Aignherr C, Bernhard G",
    title: "Predictors of outcome in patients with achalasia treated by pneumatic dilation",
    journal: "Gastroenterology",
    year: 1992,
    pmid: "1446873",
    doi: "10.1016/0016-5085(92)91438-K",
    url: "https://pubmed.ncbi.nlm.nih.gov/1446873/",
    note: "Original derivation study establishing the 4-domain, 0-12 point scoring system. Defines thresholds still used in clinical practice.",
  },
  {
    id: "boeckxstaens2011",
    authors: "Boeckxstaens GE, Annese V, des Varannes SB, et al.; European Achalasia Trial Investigators",
    title: "Pneumatic dilation versus laparoscopic Heller's myotomy for idiopathic achalasia (European Achalasia Trial)",
    journal: "New England Journal of Medicine",
    year: 2011,
    pmid: "21561346",
    doi: "10.1056/NEJMoa1010502",
    url: "https://pubmed.ncbi.nlm.nih.gov/21561346/",
    note: "Landmark RCT (n=201) that validated Eckardt Score ≤3 as the primary endpoint for treatment success.",
  },
  {
    id: "ponds2019",
    authors: "Ponds FA, Fockens P, Lei A, et al.",
    title: "Effect of Peroral Endoscopic Myotomy vs Pneumatic Dilation on Symptom Severity and Treatment Outcomes Among Treatment-Naive Patients With Achalasia",
    journal: "JAMA",
    year: 2019,
    pmid: "31553421",
    doi: "10.1001/jama.2019.13975",
    url: "https://pubmed.ncbi.nlm.nih.gov/31553421/",
    note: "Largest RCT comparing POEM vs. PD (n=133); POEM superior to PD at 2 years (92% vs 54% therapeutic success).",
  },
  {
    id: "werner2019",
    authors: "Werner YB, Hakanson B, Martinek J, et al.",
    title: "Endoscopic or Surgical Myotomy in Patients with Idiopathic Achalasia (POEM vs. Heller Trial)",
    journal: "New England Journal of Medicine",
    year: 2019,
    pmid: "31242370",
    doi: "10.1056/NEJMoa1905380",
    url: "https://pubmed.ncbi.nlm.nih.gov/31242370/",
    note: "RCT (n=221) demonstrating non-inferiority of POEM vs. LHM using Eckardt Score as primary endpoint at 2 years.",
  },
  {
    id: "kahrilas2015",
    authors: "Kahrilas PJ, Bredenoord AJ, Fox M, et al.; International HRM Working Group",
    title: "The Chicago Classification of Esophageal Motility Disorders, v3.0",
    journal: "Neurogastroenterology & Motility",
    year: 2015,
    pmid: "25469569",
    doi: "10.1111/nmo.12477",
    url: "https://pubmed.ncbi.nlm.nih.gov/25469569/",
    note: "Defines HRM-based classification of achalasia subtypes (Types I-III) that guides therapy selection alongside the Eckardt Score.",
  },
  {
    id: "slone2021",
    authors: "Slone E, Kumar S, Jacobs J, Velanovich V, Richter JE",
    title: "The Accuracy of the Eckardt Score in Detecting Treatment Failure After Achalasia Therapy",
    journal: "Journal of Clinical Gastroenterology",
    year: 2021,
    pmid: "33950013",
    doi: "10.1097/MCG.0000000000001547",
    url: "https://pubmed.ncbi.nlm.nih.gov/33950013/",
    note: "Validation study confirming Eckardt Score correlates with objective HRM findings; sensitivity 83%, specificity 75% for detecting treatment failure.",
  },
  {
    id: "vaezi2013",
    authors: "Vaezi MF, Pandolfino JE, Vela MF",
    title: "ACG Clinical Guideline: Diagnosis and Management of Achalasia",
    journal: "American Journal of Gastroenterology",
    year: 2013,
    pmid: "23877351",
    doi: "10.1038/ajg.2013.196",
    url: "https://pubmed.ncbi.nlm.nih.gov/23877351/",
    note: "ACG practice guideline endorsing Eckardt Score as the standard clinical outcome measure and defining remission as score ≤3.",
  },
  {
    id: "oude2020",
    authors: "Oude Nijhuis RAB, Zaninotto G, Roman S, et al.",
    title: "European guidelines on achalasia: United European Gastroenterology and European Society of Neurogastroenterology and Motility recommendations",
    journal: "United European Gastroenterology Journal",
    year: 2020,
    pmid: "32867553",
    doi: "10.1177/2050640620903213",
    url: "https://pubmed.ncbi.nlm.nih.gov/32867553/",
    note: "UEG/ESNM guidelines recommending Eckardt Score as standard clinical assessment at each follow-up after treatment.",
  },
];

export interface DiagnosticImage {
  id: string;
  title: string;
  caption: string;
  url: string;
  source: string;
  license: string;
  clinicalRelevance: string;
}

export const DIAGNOSTIC_IMAGES: DiagnosticImage[] = [
  {
    id: "barium-bird-beak",
    title: "Barium Esophagram: Classic 'Bird-Beak' Sign",
    caption: "Barium swallow showing the pathognomonic tapering narrowing at the gastroesophageal junction ('bird-beak' or 'rat-tail' deformity) with proximal esophageal dilation in achalasia.",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Achalasia_barium_swallow.jpg/640px-Achalasia_barium_swallow.jpg",
    source: "Wikimedia Commons",
    license: "CC BY-SA 3.0",
    clinicalRelevance: "The timed barium esophagram (TBE) quantifies esophageal emptying and is used alongside the Eckardt Score to assess treatment response. A column height >5 cm at 5 minutes suggests treatment failure.",
  },
  {
    id: "hrm-achalasia",
    title: "High-Resolution Manometry: Achalasia Pressure Topography",
    caption: "HRM pressure topography plot demonstrating elevated integrated relaxation pressure (IRP) and absent peristalsis — the manometric hallmarks of achalasia.",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/High_resolution_esophageal_manometry_-_achalasia.jpg/640px-High_resolution_esophageal_manometry_-_achalasia.jpg",
    source: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    clinicalRelevance: "Chicago Classification v4.0 subtyping (I, II, III) should precede treatment selection. Type II responds to all modalities; Type III is best treated with POEM due to longer myotomy length.",
  },
  {
    id: "endoscopy-dilated",
    title: "Upper Endoscopy: Retained Food in Dilated Esophagus",
    caption: "Endoscopic view showing retained food debris and saliva in a massively dilated esophagus with a narrowed, puckered GEJ in long-standing achalasia.",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Achalasia_Endoscopy.jpg/640px-Achalasia_Endoscopy.jpg",
    source: "Wikimedia Commons",
    license: "CC BY-SA 3.0",
    clinicalRelevance: "Endoscopy is essential to exclude pseudo-achalasia from GEJ malignancy. A dilated, food-filled esophagus with a 'popping' sensation on passage through the LES is characteristic. Always biopsy the GEJ and cardia.",
  },
  {
    id: "achalasia-anatomy",
    title: "Anatomy of the Lower Esophageal Sphincter in Achalasia",
    caption: "Schematic of the esophagus and lower esophageal sphincter showing the failure of LES relaxation and aperistalsis that characterize achalasia, contrasted with normal physiology.",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Achalasia_diagram.svg/640px-Achalasia_diagram.svg.png",
    source: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    clinicalRelevance: "Understanding the LES pathophysiology guides patient counseling about why myotomy (POEM or LHM) and pneumatic dilation work: all three aim to weaken the hypertensive, non-relaxing LES.",
  },
];

export interface CalculatorFAQ {
  question: string;
  answer: string;
  keywords: string[];
}

export const CALCULATOR_FAQS: CalculatorFAQ[] = [
  {
    question: "What is the Eckardt Score and why is it used?",
    answer: "The Eckardt Score is a 4-domain, 0-12 point symptom severity scale developed in 1992 for achalasia. It scores dysphagia, regurgitation, retrosternal chest pain, and weight loss (each 0-3). It is the primary endpoint in most achalasia treatment trials and is endorsed by ACG, UEG, and European guidelines as the standard clinical outcome measure.",
    keywords: ["what is eckardt score", "achalasia score", "achalasia severity tool"],
  },
  {
    question: "What score indicates clinical remission after treatment?",
    answer: "A post-treatment Eckardt Score ≤3 defines clinical remission. This threshold was validated in the landmark European Achalasia Trial (Boeckxstaens et al., NEJM 2011) and is used across POEM, PD, and LHM trials worldwide.",
    keywords: ["achalasia remission score", "treatment success achalasia", "eckardt score remission"],
  },
  {
    question: "How do I use this score after POEM or Heller myotomy?",
    answer: "Assess Eckardt Score at baseline, then at 4-6 weeks, 6 months, and 12 months post-procedure, then annually. A score >3 at follow-up indicates persistent or recurrent disease and should trigger investigation with timed barium esophagram (TBE) or high-resolution manometry.",
    keywords: ["POEM follow up", "post myotomy monitoring", "achalasia recurrence score"],
  },
  {
    question: "What are the Eckardt Score stages (Stage 0, I, II, III)?",
    answer: "Stage 0 (score 0-1): remission. Stage I (score 2-3): mild disease / treatment success threshold. Stage II (score 4-6): moderate disease, intervention generally indicated. Stage III (score >6): severe disease, urgent referral recommended.",
    keywords: ["eckardt stages", "achalasia grade 1 2 3", "achalasia stage classification"],
  },
  {
    question: "Can this score diagnose achalasia?",
    answer: "No. The Eckardt Score quantifies symptom severity but does not diagnose achalasia. Diagnosis requires high-resolution manometry (HRM) demonstrating elevated IRP and absent or incomplete peristalsis, supported by barium esophagram and/or upper endoscopy to exclude structural disease.",
    keywords: ["achalasia diagnosis", "manometry achalasia", "how to diagnose achalasia"],
  },
  {
    question: "Why is weight loss scored separately from dysphagia?",
    answer: "Weight loss reflects the cumulative nutritional impact of dysphagia and regurgitation over time and serves as a surrogate for disease duration and severity. Severe weight loss (>10 kg) also triggers a red flag for pseudo-achalasia from GEJ malignancy, requiring CT and endoscopic biopsy.",
    keywords: ["weight loss achalasia", "pseudo-achalasia", "GEJ malignancy achalasia"],
  },
];
