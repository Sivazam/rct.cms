/**
 * Spiritual texts, mantras, and Bhagavad Gita quotes for the cremation management system
 */

export interface SpiritualQuote {
  sanskrit: string;
  telugu: string;
  translation: string;
  chapter: string;
  context: 'death' | 'duty' | 'soul' | 'karma' | 'liberation';
}

export interface Mantra {
  sanskrit: string;
  telugu?: string;
  meaning: string;
  usage: 'beginning' | 'prayer' | 'protection' | 'liberation' | 'peace';
}

export const BHAGAVAD_GITA_QUOTES: SpiritualQuote[] = [
  {
    sanskrit: "नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः",
    telugu: "నైనం ఛిన్దన్తి శస్త్రాణి నైనం దహతి పావకః",
    translation: "The soul can never be cut to pieces by any weapon, nor burned by fire",
    chapter: "2.23",
    context: "soul"
  },
  {
    sanskrit: "न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः",
    telugu: "న జాయతే మ్రియతే వా కదాచిన్నాయం భూత్వా భవితా వా న భూయః",
    translation: "The soul is never born, nor does it die; nor having once come into being, does it ever cease to be",
    chapter: "2.20",
    context: "soul"
  },
  {
    sanskrit: "अविनाशि तु वद्धि नैनं नित्यं यः अजः शाश्वतोऽयं पुराणो",
    telugu: "అవినాశి తు వద్ధి నైనం నిత్యం యః అజః శాశ్వతోఽయం పురాణో",
    translation: "Know that which pervades the entire body is indestructible. No one can destroy the imperishable soul",
    chapter: "2.17",
    context: "soul"
  },
  {
    sanskrit: "देहिनोऽस्मिन्यथा देहौ कौमारं यौवनं जरा",
    telugu: "దేహినోఽస్మిన్యథా దేహౌ కౌమారం యౌవనం జరా",
    translation: "As the embodied soul continually passes in this body from boyhood to youth to old age",
    chapter: "2.13",
    context: "death"
  },
  {
    sanskrit: "तस्माद्वेधि महाबाहो नैवं शोचितुमर्हसि",
    telugu: "తస్మాద్వేధి మహాబాహో నైవం శోచితుమర్హసి",
    translation: "Therefore, O mighty-armed, one should not lament for that which is inevitable",
    chapter: "2.27",
    context: "death"
  },
  {
    sanskrit: "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्",
    telugu: "శ్రేయాన్స్వధర్మో విగుణః పరధర్మాత్స్వనుష్ఠితాత్",
    translation: "It is better to perform one's prescribed duties, even though they may be imperfect",
    chapter: "18.47",
    context: "duty"
  },
  {
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
    telugu: "కర్మణ్యేవాధికారస్తే మా ఫలేషు కదాచన్",
    translation: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions",
    chapter: "2.47",
    context: "duty"
  },
  {
    sanskrit: "योगः कर्मसु कौशलम्",
    telugu: "యోగః కర్మసు కౌశలమ్",
    translation: "Yoga is skill in action",
    chapter: "2.50",
    context: "duty"
  },
  {
    sanskrit: "जातस्य हि ध्रुवो मृत्युर्ध्रुवं जन्म मृतस्य च",
    telugu: "జాతస్య హి ధ్రువో మృత్యుర్ధ్రువం జన్మ మృతస్య చ",
    translation: "For one who has taken birth, death is certain; and for one who has died, birth is certain",
    chapter: "2.27",
    context: "death"
  },
  {
    sanskrit: "अहं सर्वेषु भूतेषु भूतात्मान्वस्थितः सः",
    telugu: "అహం సర్వేషు భూతేషు భూతాత్మాన్వస్థితః సః",
    translation: "I am seated in the hearts of all living entities",
    chapter: "15.15",
    context: "soul"
  }
];

export const SACRED_MANTRAS: Mantra[] = [
  {
    sanskrit: "ॐ भूर्भुवः स्वः",
    telugu: "ॐ భూర్భువః స్వః",
    meaning: "Earth, atmosphere, and heaven",
    usage: "beginning"
  },
  {
    sanskrit: "ॐ तत्सत्",
    telugu: "ॐ తత్సత్",
    meaning: "That is the truth",
    usage: "prayer"
  },
  {
    sanskrit: "ॐ शान्तिः शान्तिः शान्तिः",
    telugu: "ॐ శాంతిః శాంతిః శాంతిః",
    meaning: "Peace, peace, peace",
    usage: "peace"
  },
  {
    sanskrit: "ॐ असतो मा सद्गमय",
    telugu: "ॐ అసతో మా సద్గమయ",
    meaning: "Lead me from untruth to truth",
    usage: "liberation"
  },
  {
    sanskrit: "ॐ तमसो मा ज्योतिर्गमय",
    telugu: "ॐ తమసో మా జ్యోతిర్గమయ",
    meaning: "Lead me from darkness to light",
    usage: "liberation"
  },
  {
    sanskrit: "ॐ मृत्योर्मा अमृतं गमय",
    telugu: "ॐ మృత్యోర్మా అమృతం గమయ",
    meaning: "Lead me from death to immortality",
    usage: "liberation"
  },
  {
    sanskrit: "ॐ गं गणपतये नमः",
    telugu: "ॐ గం గణపతయే నమః",
    meaning: "Salutations to Lord Ganesha",
    usage: "beginning"
  },
  {
    sanskrit: "ॐ नमः शिवाय",
    telugu: "ॐ నమః శివాయ",
    meaning: "Salutations to Lord Shiva",
    usage: "prayer"
  },
  {
    sanskrit: "ॐ सह नाववतु",
    telugu: "ॐ సహ నావవతు",
    meaning: "May we be protected together",
    usage: "protection"
  },
  {
    sanskrit: "ॐ श्रीं ह्रीं क्लीं",
    telugu: "ॐ శ్రీం హ్రీం క్లీం",
    meaning: "Seed mantra for spiritual energy",
    usage: "prayer"
  }
];

export const DEATH_RITUAL_MANTRAS = [
  {
    sanskrit: "अग्निर्ज्योतिः अहः शुचिः क्रतुः सत्यं धर्मः",
    telugu: "అగ్నిర్జ్యోతిః అహః శుచిః క్రతుః సత్యం ధర్మః",
    meaning: "Fire is light, day is pure, sacrifice is truth, and duty is eternal",
    context: "cremation ritual"
  },
  {
    sanskrit: "यथा चित्तं तथा वाचो यथा वाचस्तथा क्रियाः",
    telugu: "యథా చిత్తం తథా వాచో యథా వాచస్తథా క్రియాః",
    meaning: "As is the mind, so are the words; as are the words, so are the actions",
    context: "karma and rebirth"
  },
  {
    sanskrit: "कर्मणा एव हि संसिद्धिमास्थिता जनकादयः",
    telugu: "కర్మణా ఏవ హి సంసిద్ధిమాస్థితా జనకాదయః",
    meaning: "Even men of knowledge act according to their nature",
    context: "duty in death rituals"
  }
];

/**
 * Get a random spiritual quote based on context
 */
export function getRandomQuote(context?: SpiritualQuote['context']): SpiritualQuote {
  let quotes = BHAGAVAD_GITA_QUOTES;
  
  if (context) {
    quotes = BHAGAVAD_GITA_QUOTES.filter(quote => quote.context === context);
  }
  
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Get a mantra based on usage
 */
export function getMantra(usage: Mantra['usage']): Mantra {
  const mantras = SACRED_MANTRAS.filter(mantra => mantra.usage === usage);
  return mantras[Math.floor(Math.random() * mantras.length)];
}

/**
 * Get a death ritual mantra
 */
export function getDeathRitualMantra() {
  return DEATH_RITUAL_MANTRAS[Math.floor(Math.random() * DEATH_RITUAL_MANTRAS.length)];
}

/**
 * Get all quotes for a specific context
 */
export function getQuotesByContext(context: SpiritualQuote['context']): SpiritualQuote[] {
  return BHAGAVAD_GITA_QUOTES.filter(quote => quote.context === context);
}

/**
 * Get all mantras for a specific usage
 */
export function getMantrasByUsage(usage: Mantra['usage']): Mantra[] {
  return SACRED_MANTRAS.filter(mantra => mantra.usage === usage);
}

/**
 * Get a random Telugu mantra for death and cremation
 */
export function getTeluguDeathMantra(): string {
  const deathQuotes = BHAGAVAD_GITA_QUOTES.filter(quote => quote.context === 'death');
  const randomQuote = deathQuotes[Math.floor(Math.random() * deathQuotes.length)];
  return randomQuote.telugu;
}

/**
 * Get a random Telugu mantra for soul and spirituality
 */
export function getTeluguSoulMantra(): string {
  const soulQuotes = BHAGAVAD_GITA_QUOTES.filter(quote => quote.context === 'soul');
  const randomQuote = soulQuotes[Math.floor(Math.random() * soulQuotes.length)];
  return randomQuote.telugu;
}

/**
 * Get a random Telugu mantra for loading screens
 */
export function getTeluguLoadingMantra(): string {
  const allTeluguMantras = SACRED_MANTRAS
    .filter(mantra => mantra.telugu)
    .map(mantra => mantra.telugu!);
  return allTeluguMantras[Math.floor(Math.random() * allTeluguMantras.length)];
}