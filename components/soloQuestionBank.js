const ALIASES = {
  car: ["automobile"],
  phone: ["smartphone", "cellphone", "cell phone"],
  soccer: ["football"],
  bicycle: ["bike"],
  airplane: ["plane", "aeroplane"],
  shoes: ["shoe"],
  pants: ["trousers"],
  icecream: ["ice cream"],
  processor: ["cpu"],
  tectonics: ["plate tectonics"],
  mitochondria: ["mitochondrion"],
  versailles: ["treaty of versailles"],
  byzantine: ["byzantine empire"],
};

const SPECIAL_HINTS = {
  apple: "A common red or green fruit that grows on trees.",
  banana: "A long yellow fruit that you peel before eating.",
  pizza: "A round food with cheese and sauce, usually cut into slices.",
  burger: "A sandwich with a patty inside a round bun.",
  dog: "A common pet that barks and wags its tail.",
  cat: "A common pet that meows and purrs.",
  blue: "The color of a clear daytime sky.",
  moon: "The object that orbits Earth and is often visible at night.",
  gravity: "The force that pulls objects toward Earth.",
  evaporation: "Liquid water changes into vapor through this process.",
  retina: "The light-sensitive layer at the back of the eye.",
  pancreas: "This organ helps with digestion and blood-sugar control.",
  equator: "An imaginary line around Earth's middle at zero degrees latitude.",
  peninsula: "Land surrounded by water on three sides.",
  firewall: "A security system that filters network traffic.",
  inflation: "A general rise in prices that reduces purchasing power.",
  archipelago: "A chain or cluster of islands grouped together.",
  mitochondria: "Organelles that generate much of a cell's usable energy.",
  metamorphosis: "A major biological transformation in body form during development.",
  supernova: "A powerful stellar explosion that can briefly outshine a galaxy.",
  quasar: "An extremely luminous active galactic nucleus powered by a distant black hole.",
  stratosphere: "The atmospheric layer above the troposphere that contains most of the ozone layer.",
  refraction: "The bending of a wave when it enters a medium where its speed changes.",
  inertia: "The tendency of an object to resist changes in its motion.",
  logarithm: "The exponent to which a base must be raised to produce a given number.",
  recursion: "A technique where a function solves a problem by calling itself on smaller versions of that problem.",
  encryption: "The process of transforming readable data into coded form to protect it.",
};

const EASY_GROUPS = [
  ["Fruit", "What fruit did Milo choose?", "It is a familiar fruit.", ["apple","banana","orange","grape","strawberry","watermelon","pineapple","mango","peach","pear"]],
  ["Food", "What food did Milo choose?", "It is a common food.", ["pizza","burger","taco","pasta","sandwich","rice","soup","steak","chicken","salad"]],
  ["Animal", "What animal did Milo choose?", "It is a well-known animal.", ["dog","cat","lion","tiger","elephant","giraffe","zebra","monkey","rabbit","horse"]],
  ["Color", "What color did Milo choose?", "It is a common color.", ["red","blue","green","yellow","purple","pink","black","white","brown","gray"]],
  ["Space", "What space answer did Milo choose?", "It is a familiar space-related word.", ["sun","moon","star","planet","comet","asteroid","galaxy","rocket","astronaut","satellite"]],
  ["Transport", "What vehicle did Milo choose?", "It is a common way to travel.", ["car","bus","train","bicycle","airplane","boat","subway","truck","scooter","helicopter"]],
  ["Technology", "What device did Milo choose?", "It is a familiar technology item.", ["phone","laptop","tablet","keyboard","mouse","monitor","camera","printer","router","headphones"]],
  ["Sport", "What sport did Milo choose?", "It is a well-known sport.", ["soccer","basketball","tennis","baseball","football","golf","hockey","volleyball","swimming","boxing"]],
  ["Place", "What place did Milo choose?", "It is a place many people recognize.", ["school","library","hospital","beach","park","museum","airport","restaurant","mall","hotel"]],
  ["Object", "What object did Milo choose?", "It is an everyday object.", ["book","chair","table","clock","key","door","pencil","bottle","umbrella","backpack"]],
  ["Weather", "What weather answer did Milo choose?", "It is a familiar weather word.", ["rain","snow","wind","thunder","lightning","fog","hail","tornado","hurricane","rainbow"]],
  ["Dessert", "What dessert did Milo choose?", "It is a popular sweet treat.", ["cake","cookie","chocolate","brownie","donut","icecream","pudding","pie","cupcake","cheesecake"]],
  ["Music", "What music item did Milo choose?", "It is a familiar music-related item.", ["guitar","piano","drums","violin","trumpet","flute","saxophone","clarinet","microphone","speaker"]],
  ["Clothing", "What clothing item did Milo choose?", "It is something people commonly wear.", ["shirt","pants","jacket","socks","shoes","hat","dress","sweater","belt","gloves"]],
  ["Job", "What job did Milo choose?", "It is a common occupation.", ["doctor","teacher","nurse","firefighter","police","chef","pilot","farmer","dentist","mechanic"]],
  ["Drink", "What drink did Milo choose?", "It is a common drink.", ["water","milk","coffee","tea","juice","soda","lemonade","smoothie","cocoa","espresso"]],
  ["School", "What school item did Milo choose?", "It is something associated with school.", ["notebook","eraser","ruler","marker","crayon","scissors","calculator","desk","locker","textbook"]],
  ["Body", "What body part did Milo choose?", "It is a familiar body part.", ["hand","foot","arm","leg","eye","ear","nose","mouth","hair","tooth"]],
  ["Nature", "What nature answer did Milo choose?", "It is something commonly found in nature.", ["tree","flower","grass","river","lake","mountain","ocean","desert","forest","waterfall"]],
  ["Home", "What household item did Milo choose?", "It is something commonly found at home.", ["bed","couch","lamp","mirror","fridge","oven","shower","sink","closet","pillow"]],
];

const MEDIUM_GROUPS = [
  ["Science", "What science term did Milo choose?", "It is a general science concept.", ["gravity","evaporation","photosynthesis","magnetism","density","friction","pressure","velocity","energy","molecule"]],
  ["Biology", "What biology term did Milo choose?", "It is a biology or anatomy term.", ["retina","pancreas","neuron","chromosome","enzyme","antibody","artery","tendon","kidney","liver"]],
  ["Geography", "What geography term did Milo choose?", "It is a geography term or landform.", ["equator","peninsula","plateau","delta","canyon","glacier","volcano","island","continent","latitude"]],
  ["Space", "What space term did Milo choose?", "It is a solar-system or sky term.", ["mercury","venus","mars","jupiter","saturn","uranus","neptune","orbit","eclipse","meteor"]],
  ["History", "What history term did Milo choose?", "It is a commonly studied history term.", ["renaissance","revolution","empire","colony","dynasty","treaty","republic","monarchy","industrialization","archaeology"]],
  ["Civics", "What civics term did Milo choose?", "It is related to government or citizenship.", ["democracy","constitution","congress","senate","judiciary","election","federalism","citizenship","legislature","amendment"]],
  ["Math", "What math term did Milo choose?", "It is a middle-level math term.", ["fraction","decimal","algebra","geometry","trapezoid","radius","diameter","equation","integer","percentage"]],
  ["Technology", "What technology term did Milo choose?", "It is related to computers or the internet.", ["processor","database","browser","server","software","hardware","algorithm","network","bandwidth","memory"]],
  ["Cybersecurity", "What security term did Milo choose?", "It is a cybersecurity concept.", ["firewall","malware","phishing","password","encryption","antivirus","breach","authentication","backup","vulnerability"]],
  ["Language", "What language term did Milo choose?", "It is a grammar or writing term.", ["adjective","noun","verb","adverb","pronoun","synonym","antonym","metaphor","idiom","punctuation"]],
  ["Music", "What music term did Milo choose?", "It is a music concept.", ["orchestra","melody","rhythm","harmony","chorus","tempo","octave","chord","symphony","percussion"]],
  ["Chemistry", "What chemistry answer did Milo choose?", "It is a common chemistry term or element.", ["oxygen","hydrogen","carbon","nitrogen","sodium","chlorine","iron","copper","acid","base"]],
  ["Economics", "What economics term did Milo choose?", "It is related to money or the economy.", ["inflation","recession","supply","demand","budget","profit","revenue","interest","salary","tax"]],
  ["Earth Science", "What earth-science term did Milo choose?", "It is related to Earth's structure or natural processes.", ["tectonics","magma","mantle","crust","sediment","erosion","fossil","mineral","earthquake","tsunami"]],
  ["Medicine", "What medical term did Milo choose?", "It is a commonly used medical term.", ["diagnosis","vaccine","symptom","therapy","surgery","infection","immunity","prescription","pulse","fracture"]],
  ["Architecture", "What architecture term did Milo choose?", "It is related to buildings or design.", ["blueprint","foundation","column","arch","dome","facade","staircase","balcony","skyscraper","bridge"]],
  ["Literature", "What literature term did Milo choose?", "It is a reading or storytelling term.", ["protagonist","plot","setting","theme","genre","narrator","dialogue","poetry","chapter","biography"]],
  ["Business", "What business term did Milo choose?", "It is a common business concept.", ["marketing","finance","accounting","strategy","inventory","customer","startup","contract","brand","merger"]],
  ["Engineering", "What engineering term did Milo choose?", "It is related to machines, electronics, or design.", ["circuit","motor","turbine","sensor","voltage","current","battery","robotics","prototype","machine"]],
  ["Art", "What art term did Milo choose?", "It is related to visual art.", ["portrait","landscape","sculpture","canvas","pigment","sketch","mural","gallery","perspective","watercolor"]],
];

const HARD_GROUPS = [
  ["Astronomy", "What astronomy term did Milo choose?", "It is an advanced astronomy term.", ["quasar","pulsar","nebula","supernova","exoplanet","redshift","singularity","magnetar","cosmology","spectroscopy"]],
  ["Cell Biology", "What cell-biology term did Milo choose?", "It is an advanced cell-biology term.", ["mitochondria","ribosome","lysosome","centrosome","cytoplasm","nucleolus","membrane","organelle","apoptosis","mitosis"]],
  ["Biochemistry", "What biochemistry term did Milo choose?", "It is a biochemistry concept.", ["glycolysis","nucleotide","peptide","lipid","metabolism","catalyst","substrate","coenzyme","polymerase","homeostasis"]],
  ["Physics", "What physics term did Milo choose?", "It is an advanced physics concept.", ["refraction","inertia","entropy","momentum","diffraction","capacitance","inductance","relativity","quantum","resonance"]],
  ["Chemistry", "What chemistry term did Milo choose?", "It is an advanced chemistry concept.", ["stoichiometry","isotope","covalent","molarity","oxidation","reduction","equilibrium","solubility","electrolysis","chromatography"]],
  ["Geology", "What geology term did Milo choose?", "It is related to Earth's rocks or crust.", ["subduction","lithosphere","asthenosphere","seismology","basalt","granite","fault","magma chamber","aquifer","karst"]],
  ["Meteorology", "What meteorology term did Milo choose?", "It is an advanced weather or atmosphere term.", ["stratosphere","troposphere","cumulonimbus","barometer","isobar","convection","humidity","cyclone","anticyclone","precipitation"]],
  ["Mathematics", "What mathematics term did Milo choose?", "It is a higher-level mathematics term.", ["logarithm","hypotenuse","derivative","integral","polynomial","asymptote","matrix","vector","theorem","factorial"]],
  ["Statistics", "What statistics term did Milo choose?", "It is a statistics or probability concept.", ["variance","median","quartile","regression","correlation","probability","distribution","percentile","sampling","covariance"]],
  ["Computing", "What computing term did Milo choose?", "It is an advanced computing concept.", ["recursion","compiler","kernel","cache","pointer","binary","hexadecimal","abstraction","concurrency","virtualization"]],
  ["Cybersecurity", "What cybersecurity term did Milo choose?", "It is an advanced security concept.", ["cryptography","ransomware","sandboxing","tokenization","biometrics","zero trust","steganography","hash collision","privilege escalation","intrusion detection"]],
  ["Linguistics", "What linguistics term did Milo choose?", "It is a linguistics or sound-pattern term.", ["onomatopoeia","phoneme","morpheme","syntax","semantics","etymology","alliteration","palindrome","homophone","diphthong"]],
  ["Literature", "What literary term did Milo choose?", "It is an advanced literary device or concept.", ["allegory","foreshadowing","juxtaposition","symbolism","satire","irony","archetype","soliloquy","oxymoron","personification"]],
  ["Philosophy", "What philosophy term did Milo choose?", "It is a philosophy concept or school of thought.", ["epistemology","ontology","ethics","logic","existentialism","utilitarianism","empiricism","rationalism","determinism","nihilism"]],
  ["Economics", "What economics term did Milo choose?", "It is an advanced economics concept.", ["monopoly","oligopoly","elasticity","liquidity","arbitrage","depreciation","externality","macroeconomics","scarcity","tariff"]],
  ["History", "What history term did Milo choose?", "It is a higher-level historical concept or period.", ["byzantine","feudalism","enlightenment","reformation","imperialism","mercantilism","armistice","suffrage","abolition","reconstruction"]],
  ["Geography", "What geography term did Milo choose?", "It is a more advanced geography term.", ["archipelago","isthmus","estuary","fjord","savanna","tundra","watershed","topography","demography","cartography"]],
  ["Medicine", "What medical term did Milo choose?", "It is an advanced medical term.", ["arrhythmia","thrombosis","embolism","neuropathy","pathology","anesthesia","oncology","hematology","radiology","immunology"]],
  ["Law", "What legal term did Milo choose?", "It is a legal or court-related concept.", ["jurisdiction","precedent","litigation","arbitration","affidavit","injunction","liability","negligence","statute","testimony"]],
  ["Engineering", "What engineering term did Milo choose?", "It is an advanced engineering concept.", ["thermodynamics","aerodynamics","hydraulics","pneumatics","semiconductor","transistor","impedance","torque","actuator","gyroscope"]],
];

function letterCount(answer) {
  return answer.replace(/[^a-z0-9]/gi, "").length;
}

function makePool(groups) {
  return groups.flatMap(([category, question, hintLead, answers]) => answers.map((answer) => {
    const first = answer.charAt(0).toUpperCase();
    const hint = SPECIAL_HINTS[answer]
      || `${hintLead} It starts with ${first} and has ${letterCount(answer)} letters.`;
    return {
      category,
      question,
      answer,
      answers: [answer, ...(ALIASES[answer] || [])],
      hint,
    };
  }));
}

export const SOLO_QUESTION_POOLS = {
  easy: makePool(EASY_GROUPS),
  medium: makePool(MEDIUM_GROUPS),
  hard: makePool(HARD_GROUPS),
};

for (const [difficulty, pool] of Object.entries(SOLO_QUESTION_POOLS)) {
  if (pool.length !== 200) {
    throw new Error(`Expected 200 ${difficulty} solo questions, found ${pool.length}.`);
  }
}
