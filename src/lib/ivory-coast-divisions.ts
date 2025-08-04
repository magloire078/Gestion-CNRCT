
export interface Division {
  [region: string]: {
    [department: string]: {
      [subPrefecture: string]: string[];
    };
  };
}

export const divisions: Division = {
  "District Autonome d'Abidjan": {
    Abidjan: {
      Abidjan: ["Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon"],
      Anyama: ["Anyama", "Ebimpé"],
      "Bingerville": ["Bingerville"],
      "Songon": ["Songon"],
    },
  },
  "District Autonome de Yamoussoukro": {
    Yamoussoukro: {
      Yamoussoukro: ["Yamoussoukro"],
    },
    Attiégouakro: {
        Attiégouakro: ["Attiégouakro"],
    }
  },
  "Agnéby-Tiassa": {
    Agboville: {
      Agboville: ["Agboville", "Ananguié", "Azaguié", "Céchi", "Grand-Morié", "Guessiguié", "Loviguié", "Oress-Krobou"],
      "Rubino": ["Rubino"],
    },
    "Sikensi": {
        "Sikensi": ["Sikensi"],
    },
    "Tiassalé": {
        "Tiassalé": ["Tiassalé"],
    },
    "Taabo": {
        "Taabo": ["Taabo"],
    }
  },
  "Sud-Comoé": {
    "Aboisso": {
      "Aboisso": ["Aboisso", "Adaou", "Adjouan", "Assinie-Mafia", "Ayamé", "Bianouan", "Kouakro", "Maféré", "Yaou"],
    },
    "Adiaké": {
      "Adiaké": ["Adiaké", "Assouba", "Etueboué"],
    },
    "Grand-Bassam": {
      "Grand-Bassam": ["Grand-Bassam", "Bongo", "Bonoua"],
    },
    "Tiapanlan": {
        "Tiapanlan": ["Tiapanlan"],
    }
  },
  // Adding a few more for variety
  "Gbêkê": {
    "Bouaké": {
        "Bouaké": ["Bouaké", "Bounda", "Brobo"],
        "Djébonoua": ["Djébonoua"],
    },
    "Sakassou": {
        "Sakassou": ["Sakassou"],
    }
  },
  "Poro": {
    "Korhogo": {
        "Korhogo": ["Korhogo", "Kanoroba", "Karakoro", "Napiéolédougou"],
        "Dikodougou": ["Dikodougou"],
    }
  }
};
