
export interface Division {
  [region: string]: {
    [department: string]: {
      [subPrefecture: string]: string[];
    };
  };
}

export const divisions: Division = {
  "Agnéby-Tiassa": {
    "Agboville": {
      "Agboville": ["Agboville", "Ananguié", "Azaguié", "Céchi", "Grand-Morié", "Guessiguié", "Loviguié", "Oress-Krobou"],
      "Rubino": ["Rubino"]
    },
    "Sikensi": {
      "Sikensi": ["Sikensi"],
      "Gomon": ["Gomon"]
    },
    "Taabo": {
      "Taabo": ["Taabo", "Pacobo"]
    },
    "Tiassalé": {
      "Tiassalé": ["Tiassalé", "Morokro", "N'Douci", "Gbolouville"]
    }
  },
  "Bafing": {
    "Koro": {
      "Koro": ["Koro", "Booko", "Borotou", "Mahandougou", "Niokosso"]
    },
    "Ouaninou": {
      "Ouaninou": ["Ouaninou", "Gbélo", "Gouékan", "Koonan", "Saboudougou", "Santa"]
    },
    "Touba": {
      "Touba": ["Touba", "Dioman", "Foungbesso", "Guintéguéla"]
    }
  },
  "Bagoué": {
    "Boundiali": {
      "Boundiali": ["Boundiali", "Baya", "Ganaoni", "Kasséré", "Siempurgo"],
      "Kouto": ["Kouto", "Blességué", "Gbon", "Koléa", "Sianhala"]
    },
    "Tengréla": {
      "Tengréla": ["Tengréla", "Débété", "Kanacoroni", "Papara"]
    }
  },
  "Bélier": {
    "Didiévi": {
      "Didiévi": ["Didiévi", "Boli", "Molonou-Blé", "Raviart", "Tié-N'Diékro"]
    },
    "Djékanou": {
      "Djékanou": ["Djékanou", "Bonikro"]
    },
    "Tiébissou": {
      "Tiébissou": ["Tiébissou", "Lomokankro", "Molonou", "Yakpabo-Sakassou"]
    },
    "Toumodi": {
      "Toumodi": ["Toumodi", "Angoda", "Kokumbo", "Kpouèbo"]
    }
  },
  "Béré": {
    "Kounahiri": {
      "Kounahiri": ["Kounahiri", "Kongasso"]
    },
    "Mankono": {
      "Mankono": ["Mankono", "Bouandougou", "Marandallah", "Sarabala", "Tiéningboué"]
    },
    "Dianra": {
      "Dianra": ["Dianra", "Dianra-Village"]
    }
  },
  "Bounkani": {
    "Bouna": {
      "Bouna": ["Bouna", "Bouko", "Ondéfidouo", "Youndouo"]
    },
    "Doropo": {
      "Doropo": ["Doropo", "Danoa", "Kalamon", "Niamoin"]
    },
    "Nassian": {
      "Nassian": ["Nassian", "Bogofa", "Kakpin", "Koutouba", "Sipilou"]
    },
    "Téhini": {
      "Téhini": ["Téhini", "Gogo", "Tougbô"]
    }
  },
  "Cavally": {
    "Bloléquin": {
      "Bloléquin": ["Bloléquin", "Diboké", "Doké", "Tinhou", "Zagné"]
    },
    "Guiglo": {
      "Guiglo": ["Guiglo", "Bedy-Goazon", "Kaadé", "Nizahon"]
    },
    "Taï": {
      "Taï": ["Taï", "Zagné"]
    },
    "Toulepleu": {
      "Toulepleu": ["Toulepleu", "Bakoubly", "Méo", "Nézosso", "Péhé", "Tiobly"]
    }
  },
  "Folon": {
    "Kaniasso": {
      "Kaniasso": ["Kaniasso", "Goulia", "Mahandiana-Sokourani", "Samatiguila"]
    },
    "Minignan": {
      "Minignan": ["Minignan", "Kimbirila-Nord", "Sokoro", "Tienko"]
    }
  },
  "Gbêkê": {
    "Béoumi": {
      "Béoumi": ["Béoumi", "Ando-Kékrénou", "Bodokro", "Kondrobo", "Lolobo", "N'Guessankro"]
    },
    "Botro": {
      "Botro": ["Botro", "Diabo", "Kouassikro", "Krofoinsou"]
    },
    "Bouaké": {
      "Bouaké": ["Bouaké", "Bounda", "Brobo", "Djébonoua", "Mamini"]
    },
    "Sakassou": {
      "Sakassou": ["Sakassou", "Ayaou-Sran", "Dibri-Assirikro", "Toumodi-Sakassou"]
    }
  },
  "Gboklè": {
    "Fresco": {
      "Fresco": ["Fresco", "Dahiri", "Gbagbam"]
    },
    "Sassandra": {
      "Sassandra": ["Sassandra", "Dakpadou", "Grihiri", "Lobakuya", "Médoni", "Sago"]
    }
  },
  "Gôh": {
    "Gagnoa": {
      "Gagnoa": ["Gagnoa", "Bayota", "Dahopa", "Diguéyo", "Dougroupalégnoa", "Gabiadji", "Guibéroua", "Ouragahio", "Sérihio", "Yopohué"]
    },
    "Oumé": {
      "Oumé": ["Oumé", "Diégonéfla", "Guépahouo", "Tonla"]
    }
  },
  "Gontougo": {
    "Bondoukou": {
      "Bondoukou": ["Bondoukou", "Appimandoum", "Bondo-Dioula", "Gogo", "Laoudi-Ba", "Pinda-Boroko", "Sapli-Sépingo", "Sorobango", "Tabagne", "Tagadi", "Taoudi", "Yézimala"]
    },
    "Koun-Fao": {
      "Koun-Fao": ["Koun-Fao", "Assuéfry", "Boahia", "Kokomian", "Kouassi-Datékro", "Tankessé", "Tienkoikro"]
    },
    "Tanda": {
      "Tanda": ["Tanda", "Amanvi", "Diamba", "Téhiri"]
    },
    "Sandégué": {
      "Sandégué": ["Sandégué", "Bandakagni-Sokoura", "Dimandougou", "Yorobodi"]
    },
    "Transua": {
      "Transua": ["Transua", "Assuéfry", "Kouassi-Nianguini"]
    }
  },
  "Grands-Ponts": {
    "Dabou": {
      "Dabou": ["Dabou", "Lopou", "Toupah"]
    },
    "Grand-Lahou": {
      "Grand-Lahou": ["Grand-Lahou", "Ahouanou", "Bacanda", "Ebonou", "Toukouzou"]
    },
    "Jacqueville": {
      "Jacqueville": ["Jacqueville", "Attoutou"]
    }
  },
  "Guémon": {
    "Bangolo": {
      "Bangolo": ["Bangolo", "Béoué-Zibiao", "Bléniméouin", "Diéoué", "Gohouo-Zagna", "Guinglo-Tahouaké", "Kahen", "Zéo", "Zou"]
    },
    "Duékoué": {
      "Duékoué": ["Duékoué", "Bagohouo", "Gbapleu", "Guézon"]
    },
    "Facobly": {
      "Facobly": ["Facobly", "Guézon", "Kouibly", "Semien", "Totrodrou"]
    },
    "Kouibly": {
      "Kouibly": ["Kouibly", "Gnama", "Ouyably-Gnondrou", "Sémien", "Totrodrou"]
    }
  },
  "Hambol": {
    "Dabakala": {
      "Dabakala": ["Dabakala", "Bassawa", "Boniérédougou", "Foumbolo", "Satama-Sokoro", "Satama-Sokoura", "Sokala-Sobara", "Tiendé"]
    },
    "Katiola": {
      "Katiola": ["Katiola", "Fronan", "Timbé"]
    },
    "Niakaramandougou": {
      "Niakaramandougou": ["Niakaramandougou", "Arikokaha", "Badikaha", "Niédiékaha", "Tortiya"]
    }
  },
  "Haut-Sassandra": {
    "Daloa": {
      "Daloa": ["Daloa", "Bédiala", "Gboguhé", "Gadouan", "Guéssabo", "Zaïo"]
    },
    "Issia": {
      "Issia": ["Issia", "Boguédia", "Iboguhé", "Nahio", "Saïoua", "Tapéguia"]
    },
    "Vavoua": {
      "Vavoua": ["Vavoua", "Bazra-Nattis", "Danané", "Dania", "Kétro-Bassam", "Séitifla"]
    },
    "Zoukougbeu": {
      "Zoukougbeu": ["Zoukougbeu", "Domangbeu", "Grégbeu", "Guessabo"]
    }
  },
  "Iffou": {
    "Daoukro": {
      "Daoukro": ["Daoukro", "Akpassanou", "Ananda", "N'Gattakro"]
    },
    "M'Bahiakro": {
      "M'Bahiakro": ["M'Bahiakro", "Bonguéra", "Kondossou"]
    },
    "Prikro": {
      "Prikro": ["Prikro", "Anianou", "Famienkro", "Nafana"]
    }
  },
  "Indénié-Djuablin": {
    "Abengourou": {
      "Abengourou": ["Abengourou", "Amélékia", "Aniassué", "Niablé", "Yakassé-Féyassé", "Zaranou"]
    },
    "Agnibilékrou": {
      "Agnibilékrou": ["Agnibilékrou", "Akoboissué", "Damé", "Duffrébo", "Tanguélan"]
    },
    "Bettié": {
      "Bettié": ["Bettié", "Diamarakro"]
    }
  },
  "Kabadougou": {
    "Gbéléban": {
      "Gbéléban": ["Gbéléban", "Samango", "Seydougou"]
    },
    "Madinani": {
      "Madinani": ["Madinani", "Fengolo", "Gougoualo", "N'Goloblasso"]
    },
    "Odienné": {
      "Odienné": ["Odienné", "Bako", "Bougousso", "Dioulatiédougou", "Séguelon", "Seydougou"]
    }
  },
  "Lôh-Djiboua": {
    "Divo": {
      "Divo": ["Divo", "Didoko", "Guébié", "Nébo", "Ogonaté", "Ziki-Diès"]
    },
    "Guéyo": {
      "Guéyo": ["Guéyo", "Dabouyo"]
    },
    "Lakota": {
      "Lakota": ["Lakota", "Djadjo", "Goudouko", "Niambézaria", "Zikisso"]
    }
  },
  "Marahoué": {
    "Bonon": {
      "Bonon": ["Bonon", "Zaguiéta"]
    },
    "Bouaflé": {
      "Bouaflé": ["Bouaflé", "Bégbessou", "N'Douffoukankro", "Pakouabo", "Tibéita"]
    },
    "Sinfra": {
      "Sinfra": ["Sinfra", "Bazré", "Kononfla", "Kouétinfla"]
    },
    "Zuénoula": {
      "Zuénoula": ["Zuénoula", "Gohitafla", "Iriéfla", "Kanzra", "Vouéboufla", "Zanzra"]
    }
  },
  "Mé": {
    "Adzopé": {
      "Adzopé": ["Adzopé", "Afféry", "Agbou", "Annepé", "Assikoi", "Bakon", "Biasso", "Yakassé-Mé"]
    },
    "Akoupé": {
      "Akoupé": ["Akoupé", "Afféry", "Bécoiffé"]
    },
    "Alépé": {
      "Alépé": ["Alépé", "Abou-Dehia", "Ahouabo", "Alosso", "Danguira", "Oghlwapo"]
    },
    "Yakassé-Attobrou": {
      "Yakassé-Attobrou": ["Yakassé-Attobrou", "Abongoua", "Biéby"]
    }
  },
  "Moronou": {
    "Arrah": {
      "Arrah": ["Arrah", "Kotobi", "Krébé"]
    },
    "Bongouanou": {
      "Bongouanou": ["Bongouanou", "Andé", "Assié-Koumassi", "N'Guessankro"]
    },
    "M'Batto": {
      "M'Batto": ["M'Batto", "Anoumaba", "Assahara", "Tiémélékro"]
    }
  },
  "N'Zi": {
    "Bocanda": {
      "Bocanda": ["Bocanda", "Bengassou", "Kouadioblékro", "N'Zèkrézessou"]
    },
    "Dimbokro": {
      "Dimbokro": ["Dimbokro", "Abigui", "Diangokro", "Nofou"]
    },
    "Kouassi-Kouassikro": {
      "Kouassi-Kouassikro": ["Kouassi-Kouassikro", "Mékro"]
    }
  },
  "Nawa": {
    "Buyo": {
      "Buyo": ["Buyo", "Dapéoua"]
    },
    "Guéyo": {
      "Guéyo": ["Guéyo", "Dabouyo"]
    },
    "Méagui": {
      "Méagui": ["Méagui", "Gnamangui", "Oupoyo"]
    },
    "Soubré": {
      "Soubré": ["Soubré", "Grand-Zattry", "Lili-yo", "Okrouyo"]
    }
  },
  "Poro": {
    "Korhogo": {
      "Korhogo": ["Korhogo", "Dikodougou", "Kanoroba", "Karakoro", "Komborodougou", "Nafoun", "Napiéolédougou", "N'Ganon", "Sinématiali", "Tioroniaradougou"],
      "M'Bengué": ["M'Bengué", "Bougou", "Katiali", "Katogo"]
    },
    "Sinématiali": {
      "Sinématiali": ["Sinématiali", "Bouakassou", "Kadéha", "Sediego"]
    }
  },
  "San-Pédro": {
    "San-Pédro": {
      "San-Pédro": ["San-Pédro", "Doba", "Dogbo", "Gabiadji"]
    },
    "Tabou": {
      "Tabou": ["Tabou", "Dapo-Iboké", "Djamandioké", "Djouroutou", "Grabo", "Olodio"]
    }
  },
  "Sud-Comoé": {
    "Aboisso": {
      "Aboisso": ["Aboisso", "Adaou", "Adjouan", "Assinie-Mafia", "Ayamé", "Bianouan", "Kouakro", "Maféré", "Yaou"]
    },
    "Adiaké": {
      "Adiaké": ["Adiaké", "Assouba", "Etueboué"]
    },
    "Grand-Bassam": {
      "Grand-Bassam": ["Grand-Bassam", "Bongo", "Bonoua"]
    },
    "Tiapanlan": {
      "Tiapanlan": ["Tiapanlan"]
    }
  },
  "Tchologo": {
    "Ferkessédougou": {
      "Ferkessédougou": ["Ferkessédougou", "Koumbala", "Niafana", "Ouara"]
    },
    "Ouangolodougou": {
      "Ouangolodougou": ["Ouangolodougou", "Diawala", "Kaouara", "Nielé", "Toumoukoro"]
    }
  },
  "Tonkpi": {
    "Biankouma": {
      "Biankouma": ["Biankouma", "Blapleu", "Gbangbégouiné", "Gbon-Houyé", "Gouiné", "Kpata", "Sipilou"]
    },
    "Danané": {
      "Danané": ["Danané", "Daleu", "Gbon-Houyé", "Kouan-Houlé", "Mahapleu", "Séileu", "Zonneu"]
    },
    "Man": {
      "Man": ["Man", "Bogouiné", "Fagnampleu", "Gbangbégouiné-Yati", "Logoualé", "Podoué", "Sangouiné", "Yapleu", "Zagoué", "Ziogouiné"]
    },
    "Sipilou": {
      "Sipilou": ["Sipilou", "Yorodougou"]
    },
    "Zouan-Hounien": {
      "Zouan-Hounien": ["Zouan-Hounien", "Banneu", "Bin-Houyé", "Goulaleu", "Téapleu", "Yelleu"]
    }
  },
  "Worodougou": {
    "Kani": {
      "Kani": ["Kani", "Djibrosso", "Fadiadougou", "Morondo"]
    },
    "Séguéla": {
      "Séguéla": ["Séguéla", "Bobi", "Diarrasoba", "Dualla", "Massala", "Sifié", "Worofla"]
    }
  },
  "District Autonome d'Abidjan": {
    "Abidjan": {
      "Abidjan": ["Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon"],
      "Anyama": ["Anyama", "Ebimpé"],
      "Bingerville": ["Bingerville"],
      "Songon": ["Songon"]
    }
  },
  "District Autonome de Yamoussoukro": {
    "Yamoussoukro": {
      "Yamoussoukro": ["Yamoussoukro"]
    },
    "Attiégouakro": {
      "Attiégouakro": ["Attiégouakro"]
    }
  }
};
