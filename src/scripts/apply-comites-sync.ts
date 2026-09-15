import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load service account
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("serviceAccountKey.json not found!");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

interface ProvidedEntry {
  num: number;
  region: string;
  department: string;
  nom: string;
  prenoms: string;
  nomComplet: string;
  fonctionLocalite: string;
  contacts: string;
  profile: string;
}

const rawData = `1	AGNEBY-TIASSA	Agboville	ADOU 	N'gbesso	Chef du village de Grand Morié 	0777880631	Nouveau
2	AGNEBY-TIASSA	Agboville	KAREKE	Christophe	Chef du village d'Oress - Krobou	5460777190	Reconduit
3	AGNEBY-TIASSA	Sikensi	DIBY 	Gnahoua Joseph	Chef du village de Sahuyé 	0707005499	Nouveau
4	AGNEBY-TIASSA	Sikensi	KACOU	Aka Bénoît	Chef du village de Bakanou B	0707476995	Nouveau
5	AGNEBY-TIASSA	Taabo	EKEFFOU	Amos Koffi	Chef du village  d'Amani Menou	0707537722	Nouveau
6	AGNEBY-TIASSA	Taabo	N'DRI	Kouassi	Chef du village de Singrobo	0504590315	Reconduit
7	AGNEBY-TIASSA	Tiassalé	BOKA	Yao	Chef du village de N'douci	0758477037	Nouveau
8	AGNEBY-TIASSA	Tiassalé	NIKEBIE	Gnamba	Chef du village d'Akoungou	0708518585	Nouveau
9	BAFING	Koro	BAKAYOKO	Kassimou	Chef de village de Koro	0757790954	Reconduit
10	BAFING	Koro	DIOMANDE	Daouda	Chef de village Booko	0748000823	Reconduit
11	BAFING	Ouaninou	BAMBA	Soty	Chef de Canton/ Kawa	0709160203	Nouveau
12	BAFING	Ouaninou	DIOMANDE	Lacine	Chef de Canton/ Toubako	0707426058	Reconduit
13	BAFING	Touba	DIOMANDE	Zoumana	Chef de canton/ Candessi	0708925350	Nouveau
14	BAFING	Touba	FADIGA	Famoussa	Chef de Canton/Touba	0757896488	Nouveau
15	BAGOUE	Boundiali	BAMBA	Lassana	Chef du Canton Gbatoh	0555686898	Reconduit
16	BAGOUE	Boundiali	KONE	Nofolossion	Chef du village de Gbemou	0701877661	Reconduit
17	BAGOUE	Kouto	KONE	Souhourou	Chef Canton Kouto	0101668289	Reconduit
18	BAGOUE	Kouto	LOZENI	Toure	Chef Canton Kolia	0708240204	Reconduit
19	BAGOUE	Tengréla	COULIBALY	Issa	Chef Canton de Tengrela	0747656126	Nouveau
20	BAGOUE	Tengréla	OUATTARA	Fankere	Chef central de Tengrela	0749155590	Nouveau
21	BELIER	Didiévi	KOMOE	Kouadio	Chef de village de Mbankassê	0709116097	Reconduit
22	BELIER	Didiévi	N'DOLI	Yao N'Guessan R.	Chef de Tribu Molonou-Blé	0778469793	Reconduit
23	BELIER	Djékanou	KOUAME	Yao Daniel	Chef de Village/Djékanou	0749700576	Reconduit
24	BELIER	Djékanou	M'BRA	Kouakou Remi	Chef de Village/Angbavia	0749184947	Reconduit
25	BELIER	Tiébissou	KOFFI	Kouame	Chef de canton Ahitou	0545059898	Nouveau
26	BELIER	Tiébissou	KOUAKOU	Amoin  Amélie	Cheffe de tribu Grogro	0778833046	Nouveau
27	BELIER	Toumodi	KOFFI	Kouadio Désiré	Chef de Village/Tchimoukro	0708262154	Nouveau
28	BELIER	Toumodi	KOUAKOU	Kouadio	Chef de Village/Dida-Kouadiokro	0749643528	Reconduit
29	BERE	Dianra	DAO	Kassimou	Chef de village de Kafegue	0504400194	Reconduit
30	BERE	Dianra	KONE	Doteme	Chef de Canton/ Gbatoh	0556272435	Reconduit
31	BERE	Kounahiri	BAGATE	Meboua	Chef de Canton/ Tofesso	0747532191	Reconduit
32	BERE	Kounahiri	KAWA	Bomisso	Chef de Canton/ Kounahiri	0142510833	Reconduit
33	BERE	Mankono	KANDE	Amara	Chef de Canton/ Ouedallah	0101589030	Reconduit
34	BERE	Mankono	TIOTE	Mamadou	Chef de Canton/ Pokoutou	0707569941	Reconduit
35	BOUNKANI	Bouna	OUATTARA	Belegnonou	Chef de village / Koflandé 	0505226424	Reconduit
36	BOUNKANI	Bouna	OUATTARA	Hinissiekoun	Chef de village / Yallo	0708507259	Reconduit
37	BOUNKANI	Doropo					
38	BOUNKANI	Doropo					
39	BOUNKANI	Nassian	KOBENAN	Yao Kindo Alain	Chef de village /Nassian 	0708180323	Reconduit
40	BOUNKANI	Nassian	KOUADIO	Dongo	Chef de canton/Bodé 	0555737522	Reconduit
41	BOUNKANI	Téhini	NOUFE	Toh	Chef de village de Vontchon	0709354728	Nouveau
42	BOUNKANI	Téhini	OUATTARA 	Karim	Chef de village de Tehini	0711550219	Reconduit
43	CAVALLY	Bloléquin	BIE	Glaou Laurent	Chef de village de Guéya	0707301187	Reconduit
44	CAVALLY	Bloléquin	BLO	Etienne	Chef de village de Bloléquin-village	0709656615	Reconduit
45	CAVALLY	Guiglo	DJI	Emile	Chef de village de Yaoudé	0708461645	Nouveau
46	CAVALLY	Guiglo	OULAI	Doue Edmond	Chef de village de Niouldé	0747338823	Reconduit
47	CAVALLY	Taï	GUI	Francois	Chef de village de Gahably	0708236779	Reconduit
48	CAVALLY	Taï	YAGNON	Valentin	Chef de village de Gouléako II	0576136545	Nouveau
49	CAVALLY	Toulepleu	DAU	Jacques	Chef de la tribu Bloawia	0758161393	Nouveau
50	CAVALLY	Toulepleu	TE 	Jean Claude	Chef de village de Seizaibli	0707393860	Nouveau
51	DISTRICT D’ABIDJAN	Abidjan	ABODOU	Mohoué Faustin	Chef du village d'Akéikoi	0101285151	Nouveau
52	DISTRICT D’ABIDJAN	Abidjan	DJOMAN	Banan Calixte	Chef du village d'Abadjin-Kouté	0748951609	Nouveau
53	DISTRICT DE YAMOUSSOUKRO	Attiegouakro	QUASHIE	Kouame Theodore	Chef de Canton/Nanafouè d'Attiégouakro	0747447853	Reconduit
54	DISTRICT DE YAMOUSSOUKRO	Attiegouakro	YAO	Kouacou Evariste	Chef de Village/Ouffoué-diékro	0709766389	Nouveau
55	DISTRICT DE YAMOUSSOUKRO	Yamoussoukro	KOUASSI	Konan	Chef de Village/Kami	0757795958	Reconduit
56	DISTRICT DE YAMOUSSOUKRO	Yamoussoukro	N'DRI	Albert	Chef de Village/Yobouekro	0701857015	Reconduit
57	FOLON	Kaniasso	DIARRASSOUBA	Souleymane	Chef du village de Kaniasso	0707383171	Nouveau
58	FOLON	Kaniasso	KONE	Dramane	Chef de canton de Goulia	0544326988	Nouveau
59	FOLON	Minignan	SANGARE	Mamadou	Chef du village de Minignan	0556755433	Reconduit
60	FOLON	Minignan	SIDIBE	Karim	Chef du village de Tienkô	0749234553	Nouveau
61	GBEKE	Béoumi	ANDOH	Koffi N'Da Siméon 	Chef de village Alloukou-Yakro	0707102009	Nouveau
62	GBEKE	Béoumi	YAO	Koffi Barthelemy	Chef de canton Kodê	0708106408	Reconduit
63	GBEKE	Botro	KOUASSI	Yao Thomas	Chef de canton Gblo Mamela	0707808390	Reconduit
64	GBEKE	Botro	TOTOKRA	Kouakou Édouard 	Chef de canton Satiklan	0707838250	Nouveau
65	GBEKE	Bouaké	KONAN	Brou	Chef de canton de Prepressou	0748323655	Nouveau
66	GBEKE	Bouaké	NGUESSAN 	Yoboue	Chef de canton de Dohoun	0708704610	Nouveau
67	GBEKE	Sakassou	KOUASSI	N'Dri	Chef de village de Komokonouan	0707259297	Reconduit
68	GBEKE	Sakassou	N’GUESSAN	Kouassi Djea	Chef de village de Kpetebonouan	0707514147	Reconduit
69	GBOKLE	Fresco	BEUGRE	Dagaud Guy Desire	Chef de village de Gomeneberi	0575197877	Reconduit
70	GBOKLE	Fresco	N'DRIN	Bogui Raphael	Chef de village de Zanéko	0707044589	Reconduit
71	GBOKLE	Sassandra	GRAH	Moni	Chef de village de Niega	0747015423	Nouveau
72	GBOKLE	Sassandra	OPIAH	François	Chef de canton Kodia	0505208924	Nouveau
73	GOH	Gagnoa	DAGO	Joachim Boga	Chef du Village de Gnalégribouo / Chef Tribu Djérégou	0707537778	Nouveau
74	GOH	Gagnoa	GADJI	Dagbo Joseph	Chef du Village de Godelilié / Chef Caton Gnébié	0707638878	Reconduit
75	GOH	Oumé	KOFFI	Diby Guy Hollang	Chef du Village de Yahofla	0709128905	Reconduit
76	GOH	Oumé	KOUAME	Yobo	Chef du Village de Badié	0748692322	Reconduit
77	GONTOUGO	Bondoukou	BINI	Kouakou	Chef de village /Binda	0707843673	Reconduit
78	GONTOUGO	Bondoukou	KOUADJO	Yeboua	Chef de Province 	0707939494	Reconduit
79	GONTOUGO	Koun-Fao	KOUABENAN	Brindoumi Gregoire	Chef de village /Krakro	0758261348	Reconduit
80	GONTOUGO	Koun-Fao	KOUADIO	Houssou	chef de village / N'gorato	0707954897	Reconduit
81	GONTOUGO	Sandégué	OUATTARA	Bamorou	chef de village /Dimandougou	0778730126	Reconduit
82	GONTOUGO	Sandégué	OUATTARA	Alliagui	Chef de canton / Sandegué	0707734130	Reconduit
83	GONTOUGO	Tanda	KOBENAN	Gboko	Chef de village/Korokobango	0707047135	Reconduit
84	GONTOUGO	Tanda	KOFFI	Mouroufie Norbert	chef de canton /Ketan 	0707709365	Reconduit
85	GONTOUGO	Transua	KOUAKOU	Ignace	Chef de canton / Transua	0707933708	Reconduit
86	GONTOUGO	Transua	YAO	Kouaf	Chef de village / Assueffry	0707643670	Reconduit
87	GRANDS-PONTS	Dabou	AGNIMEL	Yedess Laurent	Chef du village de Bouboury	0141777933	Reconduit
88	GRANDS-PONTS	Dabou	YEDAGNE	De Phillipe	Chef du village de Pandaa	0707096416	Reconduit
89	GRANDS-PONTS	Grand-Lahou	KPAGNE	Aboure Emmanuel	Chef du village de Likpilassé	0152530942	Reconduit
90	GRANDS-PONTS	Grand-Lahou	ZOUKOUAN	Kokora Gabriel	Chef du village de N'Zida	0101390507	Reconduit
91	GRANDS-PONTS	Jacqueville	DAGRI	N’Guessan Celestin	Chef du village de Bahuama	0757690942	Reconduit
92	GRANDS-PONTS	Jacqueville	OBOUAYEBA	Samuel	Chef du village de Koko	0708385965	Reconduit
93	GUEMON	Bangolo	BAH 	Béla Léopold	Chef du village de Bahibly	0585228893	Nouveau
94	GUEMON	Bangolo	TAHA	Sérou Bruno	Chef de canton Zagna et du village Yably Guinglo	0709552095	Nouveau
95	GUEMON	Duékoué	DIEGAI	Boblahet Zacharie	Chef du village de Fangolo	0708254123	Nouveau
96	GUEMON	Duékoué	DJEHE 	Dessiéhi Etienne	Chef du Canton Zagné et du village de Bagohouo	0749276990	Nouveau
97	GUEMON	Facobly	BOLOU	Jean Modeste	Chef de la Tribu Minlo	0769258005	Nouveau
98	GUEMON	Facobly	TEHOUE 	Mesmin Sylvain Pahiet	Chef de la Tribu Soho	0707487503	Nouveau
99	GUEMON	Kouibly	GNONDIE	Monnehon Benjamin	Chef du village de Guinglo-ville	0758707021	Nouveau
100	GUEMON	Kouibly	POTE 	Moussa Ismael	Chef de la tribu Nidrou	0708006347	Nouveau
101	HAMBOL	Dabakala	COULIBALY	Fatogoma	Chef de Canton/Satama-Sokoro	0757882528	Reconduit
102	HAMBOL	Dabakala	OUATTARA	Sina	Chef de Canton/Sokoura	0749534529	Reconduit
103	HAMBOL	Katiola	COULIBALY	Tiemoko	Chef de Canton/Fronan	0505594119	Reconduit
104	HAMBOL	Katiola	OUATTARA	Waogninlin	Chef de Village/Pédiakaha	0757830372	Reconduit
105	HAMBOL	Niakaramadougou	COULIBALY	Kpotery	Chef de Village/Tafiré	0707824443	Nouveau
106	HAMBOL	Niakaramadougou	KONE	Talnan	Chef de Canton/Niakara	0709349781	Reconduit
107	HAUT SASSANDRA	Daloa	KEKE	Ahipo	Chef du village de Baléa 2	0759840363	Reconduit
108	HAUT SASSANDRA	Daloa	ZAN 	Bi Kouadio	Chef du village de Faazra	0709097313	Reconduit
109	HAUT SASSANDRA	Issia	GAMA 	Yoh	Chef du village de Gazéhio	0758372174	Nouveau
110	HAUT SASSANDRA	Issia	Ipaud Lago	Pierre Michel	Chef du village de Liga	0505057704	Nouveau
111	HAUT SASSANDRA	Vavoua	BOUELY	Bi Bohié Hervé	chef du Canton Sétis et du village de Bohifla	0708023317	Reconduit
112	HAUT SASSANDRA	Vavoua	GBESSI 	Mathurin Séri	Chef du village de Fiankon	0594056704	Nouveau
113	HAUT SASSANDRA	Zoukougbeu	GUINA 	Lago Bertin	Chef du village de Bagro 2	0709981749	Reconduit
114	HAUT SASSANDRA	Zoukougbeu	ZEDE	Yves	Chef du village de Détroya	0709727204	Nouveau
115	IFFOU	Daoukro	KOUADIO	Konan	Chef de Village/d'Anoumabo S/P Daoukro	0758591602	Nouveau
116	IFFOU	Daoukro	KOUAME	Koffi Eugene	Chef de Village/Daoukro S/P Daoukro	0708452055	Reconduit
117	IFFOU	M’bahiakro	ESSE	Kouakou	Chef du Village/kouassikro S/P MBahi	0707419778	Reconduit
118	IFFOU	M’bahiakro	KOUAKOU	Kouame Jean Baptiste	Chef du Village/Amankro S/P MBahiakro	0707019441	Nouveau
119	IFFOU	Ouellé	KOFFI 	Kouassi	Chef de Village/Bedie-komenankro	0707540909	Nouveau
120	IFFOU	Ouellé	KOMENAN	Ipou	Chef de Tribu/Ngbogbo-kotoko	0707025086	Nouveau
121	IFFOU	Prikro	ABOU	Adama Kouassi Ouattara	Chef de Village/Serebou S/P Famienkro	0709302206	Nouveau
122	IFFOU	Prikro	SIAKA	Oumar	Chef de Village/Tetessi S/P Nafanan	0707485897	Reconduit
123	INDENIE-DJUABLIN	Abengourou	ANEY	Firmin	Chef de village /Bokakokoré	0707598737	Reconduit
124	INDENIE-DJUABLIN	Abengourou	ASSALE	Kouassi Victor	Chef de Canton / Niablé 	0707899714	Reconduit
125	INDENIE-DJUABLIN	Agnibilékrou	EPONON	Kouame Adolphe	Chef de village /Damé	0707877604	Reconduit
126	INDENIE-DJUABLIN	Agnibilékrou	N'GUESSAN	Brou Raymond	Chef de village /Kongodia	0707621161	Reconduit
127	INDENIE-DJUABLIN	Béttié	COBRI	Anini	Chef de village de Akebri	0709004335	Reconduit
128	INDENIE-DJUABLIN	Béttié	KOUA 	Sawou	Chef de canton / Bettié	0747851145	Nouveau
129	KABADOUGOU	Gbéléban	TOURE	Laciné	chef du village de Kogonan	0546337350	Reconduit
130	KABADOUGOU	Gbéléban	TRAORE	Youssoufou	Chef du village de Gbéléban	0545779798	Reconduit
131	KABADOUGOU	Madinani	KONE	Yaya	Chef du village de Madinani	0708634558	Reconduit
132	KABADOUGOU	Madinani	SANGARE	Vamoussa	Chef du canton de Fladougo 	0555825478	Reconduit
133	KABADOUGOU	Odiénné	DIARRASSOUBA	Doumbia Inza	Chef du canton Nafana	0505151489	Reconduit
134	KABADOUGOU	Odiénné	YOUSSOUF	Kone	Chef du canton Sienkô	0747544582	Reconduit
135	KABADOUGOU	Samatiguila	DIABY	Mamadou	Chef du village de Samatiguila	0707854840	Nouveau
136	KABADOUGOU	samatiguila	SANOGO	Brahima	Chef du village de Sanogobra-Mafélé	0768081256	Reconduit
137	KABADOUGOU	Séguélon	KONE	Baba	Chef du canton Seguelon	0748087832	Nouveau
138	KABADOUGOU	Séguélon	KONE	Issiaka	Chef du village de Lingoho	0708438862	Nouveau
139	LA ME	Adzopé	ASSI	Yapo	Chef du village de Nyan	0748727395	Nouveau
140	LA ME	Adzopé	YAPO	Gbocho Hyacinthe	Chef du village de Miadzin	5743070763	Reconduit
141	LA ME	Akoupé	ASSI	Dian	Chef du village d'Akoupé 2	0708297655	Nouveau
142	LA ME	Akoupé	KOUASSI 	N'guessan Luc	Chef du village d'Adikokoi	0707680897	Nouveau
143	LA ME	Alépé	KOUAHO 	Martin Narcisse Adja	Chef du village d'Alépé	0749773362	Nouveau
144	LA ME	Alépé	NIAMIEN	Adou Mathurin	Chef du village d'Aboisso - Comoé	0546063490	Nouveau
145	LA ME	Yakassé-Attobrou	BERRY	Seka Pierre-Dieudonne	Chef de canton Attobrou	0707028086	Reconduit
146	LA ME	Yakassé-Attobrou	YAPO	Yapi Barnabe	Chef du village de Kong 1	0708154794	Reconduit
147	LOH-DJIBOUA	Divo	ANY	Gbetto Moïse	Chef du village de Hiré	0707985610	Nouveau
148	LOH-DJIBOUA	Divo	KOFFI	Ahou Marceline	Chef du Canton Zego	0747698654	Reconduit
149	LOH-DJIBOUA	Guitry	GNEBLO	Blapka	Chef du village de Méné s/p Yacobou	0708194744	Nouveau
150	LOH-DJIBOUA	Guitry	SAMON	Godo Abry	Chef du canton Kobouo	0707481834	Nouveau
151	LOH-DJIBOUA	Lakota	GOLI	Nanebo Paul	Chef du village et Chef canton d'Akabreboua	0747916050	Reconduit
152	LOH-DJIBOUA	Lakota	LEDJOU	Gnakouri	Chef du Village Niémanakoya	0756667190	Reconduit
153	MARAHOUE	Bonon	BI	Gooré Néné	Chef de la Tribu Bonon	0708787264	Nouveau
154	MARAHOUE	Bonon	BI	Gouri Djangoné 	Chef de la Tribu Gonan	0749013010	Nouveau
155	MARAHOUE	Bouaflé	BI 	Ouai Léon Hué 	chef du village de Koblata	0757020171	Nouveau
156	MARAHOUE	Bouaflé	N'Dia	Coffi Georges Léon	Chef de Canton Ayaou	0707073532	Nouveau
157	MARAHOUE	Gohitafla	TA	Bi Trayé 	Chef du Canton Beis	0709995845	Nouveau
158	MARAHOUE	Gohitafla	YOUAN	Bi Youan	Chef du Village de Manfla	0709488000	Nouveau
159	MARAHOUE	Sinfra	ZAHOUO	Bi Bia Jean-Baptiste	Chef de la Tribu Nanan	0748112717	Nouveau
160	MARAHOUE	Sinfra	ZAKOUTA 	Bi  Kalé Mathias	chef de la Tibu  Sian	0143659391	Reconduit
161	MARAHOUE	Zuénoula	VANIE	Bi Zamble Julien	Chef de la Tribu Bouénou	0707170306	Nouveau
162	MARAHOUE	Zuénoula	BI 	Tra Mathurin Voli	Chef de la Tribu Duonon	0707912309	Nouveau
163	MORONOU	Arrah	N'GANZA	Ahissan Olivier	Chef de Tribu/Ahua	0708852248	Nouveau
164	MORONOU	Arrah	TANOH	Oi Tanoh Jean 	Chef de Village/Erobo	0748479530	Reconduit
165	MORONOU	Bongouanou	KOUADIO	Oi Kouadio	Chef de village/Agbossou S/P Ande	0707441586	Reconduit
166	MORONOU	Bongouanou	KOUAME	Akpegni Pierre	Chef de village/Bocaci S/P Bongouanou	0748335006	Reconduit
167	MORONOU	M’Batto	KAMANAN 	Assoua	Chef de Tribu/Allangoua S/P Assahara	0707910084	Reconduit
168	MORONOU	M’Batto	OUA	Boni Noel Boni	Chef de Tribu	0709088188	Reconduit
169	N’ZI	Bocanda	ELLE	Kouakou Theodore	Chef de Village/Dida-Kayabo S/P Bocanda	0707805668	Reconduit
170	N’ZI	Bocanda	KOUAKOU	Lokossue	Chef de Village/Abeanou S/P Kouadioblékro	0708719773	Reconduit
171	N’ZI	Dimbokro	KOUASSI	Koffi	Chef de Tribu/Sakiaré S/P Djagoko	0708477039	Reconduit
172	N’ZI	Dimbokro	N'DRI	Kouakou	Chef de Village/Komien Kouassikro S/P Abidji	0707867164	Reconduit
173	N’ZI	Kouassi-Kouassikro	ADI	Koffi Narcisse	Chef du Village/Adikoffikro S/P Mekro	0709774600	Reconduit
174	N’ZI	Kouassi-Kouassikro	KOFFI	Kouadio Augustin	Chef du Village/Adikoffikro S/P Kcro	0708748431	Nouveau
175	NAWA	Buyo	GATTA	Tape	Chef du Village de Wonsealy V2	0709173572	Reconduit
176	NAWA	Buyo	LIADE	Emile	Chef du Vilage de Loboville	0707355841	Nouveau
177	NAWA	Guéyo	GBAKA	Dakouri Germain	Chef du Village de Bakadou s/p Dabouyo	0748103384	Reconduit
178	NAWA	Guéyo	GNALI	Gnakouri Michel	Chef du Village de Brétihio s/p Guéyo	0749170050	Reconduit
179	NAWA	Méagui	NETRO	Barthelemy	Chef du Village de Méagui	0708541631	Reconduit
180	NAWA	Méagui	VAKA	Kple Kpeule	Chef du Village de Gnamagni / Chef de Caton Bakoué de la Nawa	0708010820	Reconduit
181	NAWA	Soubré	GBALLE	Zadou Jean-Paul	Chef du Village de Guiméyo	0707353051	Reconduit
182	NAWA	Soubré	MAGUI	Jean-Claude	Chef du Village de Gabaguhé	0748236957	Nouveau
183	PORO	Dikodougou	SORO	Ouanan Lazare	Chef de Canton de Dikodougou	0707349415	Reconduit
184	PORO	Dikodougou	YEO	Donikporo	Chef de Canton de Guiembé	0707709252	Reconduit
185	PORO	Korhogo	COULIBALY	Bakary	Chef de Canton de Komborodougou	0506016072	Reconduit
186	PORO	Korhogo	SILUE	Namitin	Chef du village de Tioroniaradougou	0584705525	Nouveau
187	PORO	M’Bengué	COULIBALY	Banako	Chef de Canton de M'bengué	0707889362	Nouveau
188	PORO	M’Bengué	COULIBALY	Zanifigué	Chef de village de M'bengué	0709745587	Nouveau
189	PORO	Sinématiali	COULIBALY	Tiémoko Yadé Dominique	Chef de Canton de Sinématiali	0758818280	Nouveau
190	PORO	Sinématiali	SILUE	Tiandiogo Dit Kone Samba	Chef de Canton de Kagbolodougou	0748313151	Reconduit
191	SAN PEDRO	San-pédro	HEMY	Daniel	Chef de village de Magné	0779325351	Reconduit
192	SAN PEDRO	San-pédro	KAH	Toh	Chef de canton Doba	0707782685	Reconduit
193	SAN PEDRO	Tabou	HIANNON	Barou Aimé	Chef de Canton BAPO	0707261613	Reconduit
194	SAN PEDRO	Tabou	HINE	Beugle	Chef du village de OMBLOKE	0747614450	Reconduit
195	SUD COMOE	Aboisso	ENAN	Eboua Francis	Roi du Sanwi	0707993586	Nouveau
196	SUD COMOE	Aboisso	TANO-BIAN	Aka	Chef du village de Maféré	0707086486	Reconduit
197	SUD COMOE	Adiaké	ANIMA	Aka	Roi des Bétibés (Adiaké)	0747958101	Reconduit
198	SUD COMOE	Adiaké	EBY	Kouame	Roi Essouma (Assinie)	0708092619	Reconduit
199	SUD COMOE	Grand-Bassam	MANZAN	Jules	Chef du village d' Azuretti	0747854974	Reconduit
200	SUD COMOE	Grand-Bassam	MIEZAN	Kacou Venance	Roi de Bonoua	0788881509	Nouveau
201	SUD COMOE	Tiapoum	KOUASSI	N’Daffo	Roi de Tiapoum	0574472431	Reconduit
202	SUD COMOE	Tiapoum	Niamké 	Niamké	Chef du village de Eboko	0709466377	Nouveau
203	TCHOLOGO	Ferkéssédougou	KONE	Mamadou Jonas	Chef de Canton de Ferkessédougou	0707670348	Reconduit
204	TCHOLOGO	Ferkéssédougou	OUATTARA	Perogniguélé Benjamin	Chef de Canton de Koumbala	0707281378	Nouveau
205	TCHOLOGO	Kong	BAMBA	Tiemoko	Chef du village de Kafolo	0747581529	Reconduit
206	TCHOLOGO	Kong	OUATTARA	Fotié	Chef du village de Kong	0708567885	Nouveau
207	TCHOLOGO	Ouangolodougou	OUATTARA	Siaka	Chef du village de Ouangolodougou	0747061597	Reconduit
208	TCHOLOGO	Ouangolodougou	OUATTARA	Mamadou	Chef du village de Torla	0709777612	Reconduit
209	TONKPI	Biankouma	CHERIFOU	Banketa	Chef du canton Toura	0707451886	Reconduit
210	TONKPI	Biankouma	DRO	Diomande	Chef de village de Biankouma Village	0709288462	Reconduit
211	TONKPI	Danané	TIOMIN	Augustin	Chef du canton Ouiné	0709800240	Reconduit
212	TONKPI	Danané	YAKE	Adama	Chef du canton Gourressé	0749677349	Reconduit
213	TONKPI	Man	GONCE	Pierre	Chef du canton Man-Campagne	0747382581	Reconduit
214	TONKPI	Man	GUEU	Emmanuel	Chef de village de Guianlé	0708318811	Reconduit
215	TONKPI	Sipilou	DIOMANDE	Aubin	Chef du canton  Sipilou	0747908297	Reconduit
216	TONKPI	Sipilou	SOUMAHORO	Droh Paul	Chef de village de Zocoma	0769369929	Reconduit
217	TONKPI	Zouan-Hounien	GOUN	Tieu Gerard	Chef du  canton Blossé	0709659377	Reconduit
218	TONKPI	Zouan-Hounien	TOMA	Lucien	Chef du canton Lollé	0708819989	Reconduit
219	WORODOUGOU	Kani	BAKAYOKO	Krobla	Chef Canton Kani	0709356745	Reconduit
220	WORODOUGOU	Kani	BAMBA	Abdoulaye	Chef de village / Soba	0708170925	Nouveau
221	WORODOUGOU	Séguéla	KONE 	El Hadj 	Chef de village/ Kamalo	0757007325	Nouveau
222	WORODOUGOU	Séguéla	NAMORY	Diomande	Chef de village/Farafing	0757898032	Nouveau`;

function parseData(): ProvidedEntry[] {
  return rawData.trim().split('\n').map(line => {
    const parts = line.split('\t').map(p => p.trim());
    return {
      num: parseInt(parts[0], 10),
      region: parts[1] || '',
      department: parts[2] || '',
      nom: parts[3] || '',
      prenoms: parts[4] || '',
      nomComplet: `${parts[3] || ''} ${parts[4] || ''}`.trim(),
      fonctionLocalite: parts[5] || '',
      contacts: parts[6] || '',
      profile: parts[7] || '',
    };
  });
}

function normalize(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVillageAndRole(fonction: string, dept: string): { role: string; village: string; title: string } {
  const fLower = fonction.toLowerCase();
  let role = "Chef de Village";
  let village = "";

  if (fLower.includes('roi')) {
    role = "Roi";
  } else if (fLower.includes('province')) {
    role = "Chef de province";
  } else if (fLower.includes('canton')) {
    role = "Chef de canton";
  } else if (fLower.includes('tribu')) {
    role = "Chef de tribu";
  }

  // Extract locality/village name from patterns
  const matchVillage = fonction.match(/(?:village de|village d'|village\/|village \/|village|canton de|canton d'|canton\/|canton \/|canton|tribu de|tribu d'|tribu\/|tribu \/|tribu|roi du|roi des|roi de|province de|province d'|province)\s*(.*)/i);
  if (matchVillage && matchVillage[1]) {
    village = matchVillage[1].trim();
  } else {
    village = fonction;
  }

  // Clean up village
  village = village.replace(/^[\/\-\:\s]+/, '').trim();
  if (!village) village = dept;

  return {
    role,
    village,
    title: fonction || "Membre du Comité Régional"
  };
}

async function runSync() {
  console.log("=== STARTING FIRESTORE COMITÉS RÉGIONAUX SYNC ===");
  const provided = parseData();

  const chiefsRef = db.collection('chiefs');
  const employeesRef = db.collection('employees');

  console.log("Fetching existing Firestore chiefs...");
  const chiefsSnap = await chiefsRef.get();
  const dbChiefs = chiefsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any, ref: doc.ref }));
  console.log(`Loaded ${dbChiefs.length} existing chiefs.`);

  console.log("Fetching existing Firestore employees...");
  const empSnap = await employeesRef.get();
  const dbEmployees = empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any, ref: doc.ref }));
  console.log(`Loaded ${dbEmployees.length} existing employees.`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedVacant = 0;
  let empSyncedCount = 0;

  for (const entry of provided) {
    if (!entry.nomComplet) {
      console.log(`[SKIP VACANT] #${entry.num} ${entry.region} / ${entry.department}`);
      skippedVacant++;
      continue;
    }

    const { role, village, title } = extractVillageAndRole(entry.fonctionLocalite, entry.department);
    const isReconduit = entry.profile.toLowerCase() === 'reconduit';

    // Find existing chief in Firestore
    const normEntryName = normalize(entry.nomComplet);
    const normEntryNom = normalize(entry.nom);
    const normEntryRegion = normalize(entry.region);
    const normEntryDept = normalize(entry.department);

    let matchedChief = dbChiefs.find(c => {
      const cFullName = `${c.lastName || c.nom || ''} ${c.firstName || c.prenoms || ''}`.trim() || c.name || '';
      const normCName = normalize(cFullName);
      const normCRegion = normalize(c.region || '');
      const normCDept = normalize(c.department || '');

      const isSameName = normCName === normEntryName || (normEntryNom && normCName.includes(normEntryNom) && normCName.startsWith(normEntryNom));
      const isSameLocation = normCRegion === normEntryRegion && normCDept === normEntryDept;

      return isSameName && (isSameLocation || !c.region);
    });

    // Fallback: match by full name alone if strong
    if (!matchedChief) {
      matchedChief = dbChiefs.find(c => {
        const cFullName = `${c.lastName || c.nom || ''} ${c.firstName || c.prenoms || ''}`.trim() || c.name || '';
        return normalize(cFullName) === normEntryName;
      });
    }

    const chiefData: any = {
      name: entry.nomComplet,
      lastName: entry.nom.trim(),
      firstName: entry.prenoms.trim(),
      title: entry.fonctionLocalite,
      role,
      cnrctAffiliation: 'Comité Régional',
      region: entry.region,
      department: entry.department,
      subPrefecture: entry.department,
      village,
      contact: entry.contacts,
      phone: entry.contacts,
      status: 'actif',
      estRenouvele: isReconduit,
      profile: entry.profile,
      updatedAt: new Date().toISOString(),
    };

    let chiefId = '';

    if (matchedChief) {
      chiefId = matchedChief.id;
      await matchedChief.ref.update(chiefData);
      updatedCount++;
      console.log(`[UPDATE CHIEF] #${entry.num} ${entry.nomComplet} (ID: ${chiefId}) - ${entry.region}/${entry.department}`);
    } else {
      chiefData.createdAt = new Date().toISOString();
      chiefData.bio = `Membre du Comité Régional du CNRCT - Région ${entry.region}, Département de ${entry.department}.`;
      chiefData.photoUrl = `https://placehold.co/400x400/png?text=${entry.nom.charAt(0)}${entry.prenoms.charAt(0)}`;
      const newChiefDoc = await chiefsRef.add(chiefData);
      chiefId = newChiefDoc.id;
      createdCount++;
      console.log(`[CREATE CHIEF] #${entry.num} ${entry.nomComplet} (NEW ID: ${chiefId}) - ${entry.region}/${entry.department}`);
    }

    // Now Sync with Employee document
    const matchedEmployee = dbEmployees.find(e => {
      const eFullName = `${e.lastName || ''} ${e.firstName || ''}`.trim() || e.name || '';
      return e.chiefId === chiefId || normalize(eFullName) === normEntryName;
    });

    const employeeData: any = {
      name: entry.nomComplet,
      lastName: entry.nom.trim(),
      firstName: entry.prenoms.trim(),
      poste: 'Membre du Comité Régional',
      departmentId: 'comites-regionaux',
      groupe_2: 'Rois & Chefs',
      Region: entry.region,
      Departement: entry.department,
      subPrefecture: entry.department,
      Village: village,
      contact: entry.contacts,
      mobile: entry.contacts,
      status: 'Actif',
      chiefId,
      estRenouvele: isReconduit,
      updatedAt: new Date().toISOString()
    };

    if (matchedEmployee) {
      await matchedEmployee.ref.update(employeeData);
      empSyncedCount++;
    } else {
      employeeData.createdAt = new Date().toISOString();
      employeeData.sexe = entry.prenoms.toLowerCase().includes('amélie') || entry.prenoms.toLowerCase().includes('marceline') ? 'Femme' : 'Homme';
      await employeesRef.add(employeeData);
      empSyncedCount++;
    }
  }

  console.log("\n=== SYNC COMPLETED SUCCESSFULLY ===");
  console.log(`Total Provided Entries: ${provided.length}`);
  console.log(`Chefs Updated in Firestore: ${updatedCount}`);
  console.log(`Chefs Created in Firestore: ${createdCount}`);
  console.log(`Employees Synced in Firestore: ${empSyncedCount}`);
  console.log(`Vacant / Unfilled Rows Skipped: ${skippedVacant}`);
  process.exit(0);
}

runSync().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
