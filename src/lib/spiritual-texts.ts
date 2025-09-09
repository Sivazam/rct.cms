/**
 * Spiritual texts, mantras, and Bhagavad Gita quotes for the cremation management system
 */

export interface SpiritualQuote {
  sanskrit: string;
  translation: string;
  chapter: string;
  context: 'death' | 'duty' | 'soul' | 'karma' | 'liberation';
}

export interface Mantra {
  sanskrit: string;
  meaning: string;
  usage: 'beginning' | 'prayer' | 'protection' | 'liberation' | 'peace';
}

export const BHAGAVAD_GITA_QUOTES: SpiritualQuote[] = [
  {
    sanskrit: "नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः",
    translation: "The soul can never be cut to pieces by any weapon, nor burned by fire",
    chapter: "2.23",
    context: "soul"
  },
  {
    sanskrit: "न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः",
    translation: "The soul is never born, nor does it die; nor having once come into being, does it ever cease to be",
    chapter: "2.20",
    context: "soul"
  },
  {
    sanskrit: "अविनाशि तु वद्धि नैनं नित्यं यः अजः शाश्वतोऽयं पुराणो",
    translation: "Know that which pervades the entire body is indestructible. No one can destroy the imperishable soul",
    chapter: "2.17",
    context: "soul"
  },
  {
    sanskrit: "देहिनोऽस्मिन्यथा देहौ कौमारं यौवनं जरा",
    translation: "As the embodied soul continually passes in this body from boyhood to youth to old age",
    chapter: "2.13",
    context: "death"
  },
  {
    sanskrit: "तस्माद्वेधि महाबाहो नैवं शोचितुमर्हसि",
    translation: "Therefore, O mighty-armed, one should not lament for that which is inevitable",
    chapter: "2.27",
    context: "death"
  },
  {
    sanskrit: "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्",
    translation: "It is better to perform one's prescribed duties, even though they may be imperfect",
    chapter: "18.47",
    context: "duty"
  },
  {
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
    translation: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions",
    chapter: "2.47",
    context: "duty"
  },
  {
    sanskrit: "योगः कर्मसु कौशलम्",
    translation: "Yoga is skill in action",
    chapter: "2.50",
    context: "duty"
  },
  {
    sanskrit: "जातस्य हि ध्रुवो मृत्युर्ध्रुवं जन्म मृतस्य च",
    translation: "For one who has taken birth, death is certain; and for one who has died, birth is certain",
    chapter: "2.27",
    context: "death"
  },
  {
    sanskrit: "अहं सर्वेषु भूतेषु भूतात्मान्वस्थितः सः",
    translation: "I am seated in the hearts of all living entities",
    chapter: "15.15",
    context: "soul"
  }
];

export const SACRED_MANTRAS: Mantra[] = [
  {
    sanskrit: "ॐ भूर्भुवः स्वः",
    meaning: "Earth, atmosphere, and heaven",
    usage: "beginning"
  },
  {
    sanskrit: "ॐ तत्सत्",
    meaning: "That is the truth",
    usage: "prayer"
  },
  {
    sanskrit: "ॐ शान्तिः शान्तिः शान्तिः",
    meaning: "Peace, peace, peace",
    usage: "peace"
  },
  {
    sanskrit: "ॐ असतो मा सद्गमय",
    meaning: "Lead me from untruth to truth",
    usage: "liberation"
  },
  {
    sanskrit: "ॐ तमसो मा ज्योतिर्गमय",
    meaning: "Lead me from darkness to light",
    usage: "liberation"
  },
  {
    sanskrit: "ॐ मृत्योर्मा अमृतं गमय",
    meaning: "Lead me from death to immortality",
    usage: "liberation"
  },
  {
    sanskrit: "ॐ गं गणपतये नमः",
    meaning: "Salutations to Lord Ganesha",
    usage: "beginning"
  },
  {
    sanskrit: "ॐ नमः शिवाय",
    meaning: "Salutations to Lord Shiva",
    usage: "prayer"
  },
  {
    sanskrit: "ॐ सह नाववतु",
    meaning: "May we be protected together",
    usage: "protection"
  },
  {
    sanskrit: "ॐ श्रीं ह्रीं क्लीं",
    meaning: "Seed mantra for spiritual energy",
    usage: "prayer"
  }
];

export const DEATH_RITUAL_MANTRAS = [
  {
    sanskrit: "अग्निर्ज्योतिः अहः शुचिः क्रतुः सत्यं धर्मः",
    meaning: "Fire is light, day is pure, sacrifice is truth, and duty is eternal",
    context: "cremation ritual"
  },
  {
    sanskrit: "यथा चित्तं तथा वाचो यथा वाचस्तथा क्रियाः",
    meaning: "As is the mind, so are the words; as are the words, so are the actions",
    context: "karma and rebirth"
  },
  {
    sanskrit: "कर्मणा एव हि संसिद्धिमास्थिता जनकादयः",
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