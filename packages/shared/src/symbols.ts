// F&O symbol catalogue. Pure data and search. The web combobox and the mobile sheet both use this.

export type Suggestion = {
  symbol: string;
  name: string;
  sector?: string;
};

// Quick-access symbols listed below the search bar
export const QUICK = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "INFY"];

// Popular / Trending companies shown in the dropdown before user types anything
// (Curated to be DIFFERENT from the QUICK symbols above)
export const POPULAR_COMPANIES: Suggestion[] = [
  { symbol: "ICICIBANK",  name: "ICICI Bank",                   sector: "Banking" },
  { symbol: "SBIN",       name: "State Bank of India",          sector: "Banking" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel",                sector: "Telecom" },
  { symbol: "LT",         name: "Larsen & Toubro",              sector: "Capital Goods" },
  { symbol: "TATAMOTORS", name: "Tata Motors",                  sector: "Automobile" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance",                sector: "Financial" },
  { symbol: "MARUTI",     name: "Maruti Suzuki",                sector: "Automobile" },
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical",           sector: "Pharma" },
  { symbol: "ITC",        name: "ITC Limited",                  sector: "FMCG" },
  { symbol: "TATASTEEL",  name: "Tata Steel",                   sector: "Metals" },
  { symbol: "AXISBANK",   name: "Axis Bank",                    sector: "Banking" },
  { symbol: "KOTAKBANK",  name: "Kotak Mahindra Bank",          sector: "Banking" },
];

// Comprehensive NSE F&O symbol catalog
export const NSE_FO_SYMBOLS: Suggestion[] = [
  // Major Indices
  { symbol: "NIFTY",        name: "Nifty 50 Index",                  sector: "Index" },
  { symbol: "BANKNIFTY",    name: "Bank Nifty Index",                sector: "Index" },
  { symbol: "FINNIFTY",     name: "Nifty Financial Services",        sector: "Index" },
  { symbol: "MIDCPNIFTY",   name: "Nifty Midcap Select",             sector: "Index" },
  { symbol: "SENSEX",       name: "BSE Sensex Index",                sector: "Index" },

  // Banking & Financial Services
  { symbol: "HDFCBANK",     name: "HDFC Bank",                       sector: "Banking" },
  { symbol: "ICICIBANK",    name: "ICICI Bank",                      sector: "Banking" },
  { symbol: "SBIN",         name: "State Bank of India",             sector: "Banking" },
  { symbol: "AXISBANK",     name: "Axis Bank",                       sector: "Banking" },
  { symbol: "KOTAKBANK",    name: "Kotak Mahindra Bank",             sector: "Banking" },
  { symbol: "INDUSINDBK",   name: "IndusInd Bank",                   sector: "Banking" },
  { symbol: "BANKBARODA",   name: "Bank of Baroda",                  sector: "Banking" },
  { symbol: "PNB",          name: "Punjab National Bank",            sector: "Banking" },
  { symbol: "CANBK",        name: "Canara Bank",                     sector: "Banking" },
  { symbol: "FEDERALBNK",   name: "Federal Bank",                    sector: "Banking" },
  { symbol: "IDFCFIRSTB",   name: "IDFC First Bank",                 sector: "Banking" },
  { symbol: "BANDHANBNK",   name: "Bandhan Bank",                    sector: "Banking" },
  { symbol: "AUBANK",       name: "AU Small Finance Bank",           sector: "Banking" },
  { symbol: "RBLBANK",      name: "RBL Bank",                        sector: "Banking" },
  { symbol: "BAJFINANCE",   name: "Bajaj Finance",                   sector: "Financial" },
  { symbol: "BAJAJFINSV",   name: "Bajaj Finserv",                   sector: "Financial" },
  { symbol: "CHOLAFIN",     name: "Cholamandalam Investment",        sector: "Financial" },
  { symbol: "SHRIRAMFIN",   name: "Shriram Finance",                 sector: "Financial" },
  { symbol: "MUTHOOTFIN",   name: "Muthoot Finance",                 sector: "Financial" },
  { symbol: "PFC",          name: "Power Finance Corporation",       sector: "Financial" },
  { symbol: "RECLTD",       name: "REC Limited",                     sector: "Financial" },
  { symbol: "IRFC",         name: "Indian Railway Finance Corp",     sector: "Financial" },
  { symbol: "HDFCLIFE",     name: "HDFC Life Insurance",             sector: "Insurance" },
  { symbol: "SBILIFE",      name: "SBI Life Insurance",              sector: "Insurance" },
  { symbol: "LICHSGFIN",    name: "LIC Housing Finance",             sector: "Financial" },
  { symbol: "JIOFIN",       name: "Jio Financial Services",          sector: "Financial" },

  // Information Technology
  { symbol: "TCS",          name: "Tata Consultancy Services",       sector: "IT" },
  { symbol: "INFY",         name: "Infosys",                         sector: "IT" },
  { symbol: "HCLTECH",      name: "HCL Technologies",                sector: "IT" },
  { symbol: "WIPRO",        name: "Wipro",                           sector: "IT" },
  { symbol: "TECHM",        name: "Tech Mahindra",                   sector: "IT" },
  { symbol: "LTIM",         name: "LTIMindtree",                     sector: "IT" },
  { symbol: "PERSISTENT",   name: "Persistent Systems",              sector: "IT" },
  { symbol: "COFORGE",      name: "Coforge",                         sector: "IT" },
  { symbol: "MPHASIS",      name: "Mphasis",                         sector: "IT" },
  { symbol: "OFSS",         name: "Oracle Financial Services",       sector: "IT" },

  // Energy, Oil, Gas & Utilities
  { symbol: "RELIANCE",     name: "Reliance Industries",             sector: "Energy" },
  { symbol: "ONGC",         name: "Oil & Natural Gas Corp",          sector: "Energy" },
  { symbol: "NTPC",         name: "NTPC Limited",                    sector: "Power" },
  { symbol: "POWERGRID",    name: "Power Grid Corp of India",        sector: "Power" },
  { symbol: "COALINDIA",    name: "Coal India",                      sector: "Mining" },
  { symbol: "BPCL",         name: "Bharat Petroleum",                sector: "Energy" },
  { symbol: "IOC",          name: "Indian Oil Corporation",          sector: "Energy" },
  { symbol: "HINDPETRO",    name: "Hindustan Petroleum",             sector: "Energy" },
  { symbol: "GAIL",         name: "GAIL India",                      sector: "Gas" },
  { symbol: "IGL",          name: "Indraprastha Gas",                sector: "Gas" },
  { symbol: "MGL",          name: "Mahanagar Gas",                   sector: "Gas" },
  { symbol: "TATAPOWER",    name: "Tata Power",                      sector: "Power" },
  { symbol: "ADANIENT",     name: "Adani Enterprises",               sector: "Conglomerate" },
  { symbol: "ADANIPORTS",   name: "Adani Ports & SEZ",               sector: "Infrastructure" },

  // Automobiles & Auto Ancillaries
  { symbol: "TATAMOTORS",   name: "Tata Motors",                     sector: "Automobile" },
  { symbol: "MARUTI",       name: "Maruti Suzuki India",             sector: "Automobile" },
  { symbol: "M&M",          name: "Mahindra & Mahindra",             sector: "Automobile" },
  { symbol: "BAJAJ-AUTO",   name: "Bajaj Auto",                      sector: "Automobile" },
  { symbol: "EICHERMOT",    name: "Eicher Motors",                   sector: "Automobile" },
  { symbol: "HEROMOTOCO",   name: "Hero MotoCorp",                   sector: "Automobile" },
  { symbol: "TVSMOTOR",     name: "TVS Motor Company",               sector: "Automobile" },
  { symbol: "BHARATFORG",   name: "Bharat Forge",                    sector: "Auto Ancillary" },
  { symbol: "BALKRISIND",   name: "Balkrishna Industries",           sector: "Auto Ancillary" },
  { symbol: "APOLLOTYRE",   name: "Apollo Tyres",                    sector: "Auto Ancillary" },
  { symbol: "MRF",          name: "MRF Limited",                     sector: "Auto Ancillary" },
  { symbol: "MOTHERSON",    name: "Samvardhana Motherson",           sector: "Auto Ancillary" },

  // Metals & Mining
  { symbol: "TATASTEEL",    name: "Tata Steel",                      sector: "Metals" },
  { symbol: "JSWSTEEL",     name: "JSW Steel",                       sector: "Metals" },
  { symbol: "HINDALCO",     name: "Hindalco Industries",             sector: "Metals" },
  { symbol: "VEDL",         name: "Vedanta Limited",                 sector: "Metals" },
  { symbol: "SAIL",         name: "Steel Authority of India",        sector: "Metals" },
  { symbol: "NMDC",         name: "NMDC Limited",                    sector: "Mining" },
  { symbol: "JINDALSTEL",   name: "Jindal Steel & Power",            sector: "Metals" },
  { symbol: "NATIONALUM",   name: "National Aluminium",              sector: "Metals" },

  // Healthcare & Pharmaceuticals
  { symbol: "SUNPHARMA",    name: "Sun Pharmaceutical",              sector: "Pharma" },
  { symbol: "CIPLA",        name: "Cipla",                           sector: "Pharma" },
  { symbol: "DRREDDY",      name: "Dr Reddy's Laboratories",         sector: "Pharma" },
  { symbol: "DIVISLAB",     name: "Divi's Laboratories",             sector: "Pharma" },
  { symbol: "APOLLOHOSP",   name: "Apollo Hospitals",                sector: "Healthcare" },
  { symbol: "AUROPHARMA",   name: "Aurobindo Pharma",                sector: "Pharma" },
  { symbol: "LUPIN",        name: "Lupin Limited",                   sector: "Pharma" },
  { symbol: "TORNTPHARM",   name: "Torrent Pharmaceuticals",         sector: "Pharma" },
  { symbol: "BIOCON",       name: "Biocon Limited",                  sector: "Biotech" },

  // FMCG, Retail & Consumer
  { symbol: "HINDUNILVR",   name: "Hindustan Unilever",              sector: "FMCG" },
  { symbol: "ITC",          name: "ITC Limited",                     sector: "FMCG" },
  { symbol: "NESTLEIND",    name: "Nestle India",                    sector: "FMCG" },
  { symbol: "BRITANNIA",    name: "Britannia Industries",            sector: "FMCG" },
  { symbol: "TATACONSUM",   name: "Tata Consumer Products",          sector: "FMCG" },
  { symbol: "DABUR",        name: "Dabur India",                     sector: "FMCG" },
  { symbol: "MARICO",       name: "Marico Limited",                  sector: "FMCG" },
  { symbol: "COLPAL",       name: "Colgate-Palmolive India",         sector: "FMCG" },
  { symbol: "GODREJCP",     name: "Godrej Consumer Products",        sector: "FMCG" },
  { symbol: "TITAN",        name: "Titan Company",                   sector: "Consumer" },
  { symbol: "TRENT",        name: "Trent Limited (Westside/Zudio)",  sector: "Retail" },
  { symbol: "DMART",        name: "Avenue Supermarts (DMart)",       sector: "Retail" },
  { symbol: "PAGEIND",      name: "Page Industries (Jockey)",        sector: "Apparel" },
  { symbol: "ASIANPAINT",   name: "Asian Paints",                    sector: "Paints" },
  { symbol: "BERGEPAINT",   name: "Berger Paints",                   sector: "Paints" },
  { symbol: "PIDILITIND",   name: "Pidilite Industries (Fevicol)",   sector: "Chemicals" },
  { symbol: "HAVELLS",      name: "Havells India",                   sector: "Electricals" },
  { symbol: "POLYCAB",      name: "Polycab India",                   sector: "Cables" },
  { symbol: "VOLTAS",       name: "Voltas",                          sector: "Appliances" },
  { symbol: "DIXON",        name: "Dixon Technologies",              sector: "Electronics" },

  // Capital Goods, Defense & Infrastructure
  { symbol: "LT",           name: "Larsen & Toubro",                 sector: "Capital Goods" },
  { symbol: "HAL",          name: "Hindustan Aeronautics",           sector: "Defense" },
  { symbol: "BEL",          name: "Bharat Electronics",              sector: "Defense" },
  { symbol: "SIEMENS",      name: "Siemens India",                   sector: "Capital Goods" },
  { symbol: "ABB",          name: "ABB India",                       sector: "Capital Goods" },
  { symbol: "BHEL",         name: "Bharat Heavy Electricals",        sector: "Capital Goods" },
  { symbol: "ULTRACEMCO",   name: "UltraTech Cement",                sector: "Cement" },
  { symbol: "GRASIM",       name: "Grasim Industries",               sector: "Cement" },
  { symbol: "DLF",          name: "DLF Limited",                     sector: "Realty" },
  { symbol: "GODREJPROP",   name: "Godrej Properties",               sector: "Realty" },
  { symbol: "OBEROIRLTY",   name: "Oberoi Realty",                   sector: "Realty" },
  { symbol: "PRESTIGE",     name: "Prestige Estates",                sector: "Realty" },
  { symbol: "GMRINFRA",     name: "GMR Airports Infrastructure",     sector: "Infrastructure" },
  { symbol: "CONCOR",       name: "Container Corp of India",         sector: "Logistics" },
  { symbol: "IRCTC",        name: "Indian Railway Catering (IRCTC)", sector: "Services" },
  { symbol: "INDIGO",       name: "InterGlobe Aviation (IndiGo)",    sector: "Aviation" },

  // Telecom & Tech Internet
  { symbol: "BHARTIARTL",   name: "Bharti Airtel",                   sector: "Telecom" },
  { symbol: "ZOMATO",       name: "Zomato Limited",                  sector: "Internet" },
  { symbol: "NAUKRI",       name: "Info Edge (Naukri)",              sector: "Internet" },
  { symbol: "INDIAMART",    name: "IndiaMART InterMESH",             sector: "Internet" },
  { symbol: "PAYTM",        name: "One97 Communications (Paytm)",    sector: "Fintech" },
  { symbol: "NYKAA",        name: "FSN E-Commerce (Nykaa)",          sector: "E-Commerce" },
];

// Ranked local search across the symbol catalog
export function filterSymbols(query: string): Suggestion[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return POPULAR_COMPANIES;
  }

  const q = trimmed.toUpperCase();
  const exact: Suggestion[] = [];
  const symbolStarts: Suggestion[] = [];
  const symbolContains: Suggestion[] = [];
  const nameStarts: Suggestion[] = [];
  const nameContains: Suggestion[] = [];

  const seen = new Set<string>();

  for (const item of NSE_FO_SYMBOLS) {
    const sym = item.symbol.toUpperCase();
    const name = item.name.toUpperCase();

    if (sym === q || name === q) {
      exact.push(item);
      seen.add(item.symbol);
    } else if (sym.startsWith(q)) {
      symbolStarts.push(item);
      seen.add(item.symbol);
    } else if (sym.includes(q)) {
      symbolContains.push(item);
      seen.add(item.symbol);
    } else if (name.startsWith(q)) {
      nameStarts.push(item);
      seen.add(item.symbol);
    } else if (name.includes(q)) {
      nameContains.push(item);
      seen.add(item.symbol);
    }
  }

  const combined = [
    ...exact,
    ...symbolStarts,
    ...symbolContains,
    ...nameStarts,
    ...nameContains,
  ];

  return combined.slice(0, 10);
}

export const symbolName = (symbol: string) => NSE_FO_SYMBOLS.find((s) => s.symbol === symbol)?.name;

