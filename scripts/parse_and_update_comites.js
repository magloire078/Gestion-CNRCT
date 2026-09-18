const fs = require('fs');
const path = require('path');

const rawTsv = `N°\tRegion\tDepartement\tNOM\tPRENOMS\tQualité chefs\tLocalité\tContacts\tProfile\tSexe
1\tDISTRICT D’ABIDJAN\tAbidjan\tABODOU\tMohoué Faustin\tChef de Village\tAkéikoi\t0101285151\tNouveau\tHomme
2\tDISTRICT D’ABIDJAN\tAbidjan\tDJOMAN\tBanan Calixte\tChef de Village\tAbadjin-Kouté\t0748951609\tNouveau\tHomme
3\tDISTRICT DE YAMOUSSOUKRO\tAttiegouakro\tQUASHIE\tKouame Theodore\tChef de Canton\tNanafouè d'Attiégouakro\t0747447853\tReconduit\tHomme
4\tDISTRICT DE YAMOUSSOUKRO\tAttiegouakro\tYAO\tKouacou Evariste\tChef de Village\tOuffoué-diékro\t0709766389\tNouveau\tHomme
5\tDISTRICT DE YAMOUSSOUKRO\tYamoussoukro\tKOUASSI\tKonan\tChef de Village\tKami\t0757795958\tReconduit\tHomme
6\tDISTRICT DE YAMOUSSOUKRO\tYamoussoukro\tN'DRI\tAlbert\tChef de Village\tYobouekro\t0701857015\tReconduit\tHomme
7\tAGNEBY-TIASSA\tAgboville\tADOU \tN'gbesso\tChef de Village\tGrand Morié\t0777880631\tNouveau\tHomme
8\tAGNEBY-TIASSA\tAgboville\tKAREKE\tChristophe\tChef de Village\tOress - Krobou\t5460777190\tReconduit\tHomme
9\tAGNEBY-TIASSA\tSikensi\tDIBY \tGnahoua Joseph\tChef de Village\tSahuyé\t0707005499\tNouveau\tHomme
10\tAGNEBY-TIASSA\tSikensi\tKACOU\tAka Bénoît\tChef de Village\tBakanou B\t0707476995\tNouveau\tHomme
11\tAGNEBY-TIASSA\tTaabo\tEKEFFOU\tAmos Koffi\tChef de Village\tAmani Menou\t0707537722\tNouveau\tHomme
12\tAGNEBY-TIASSA\tTaabo\tN'DRI\tKouassi\tChef de Village\tSingrobo\t0504590315\tReconduit\tHomme
13\tAGNEBY-TIASSA\tTiassalé\tBOKA\tYao\tChef de Village\tN'douci\t0758477037\tNouveau\tHomme
14\tAGNEBY-TIASSA\tTiassalé\tNIKEBIE\tGnamba\tChef de Village\tAkoungou\t0708518585\tNouveau\tHomme
15\tBAFING\tKoro\tBAKAYOKO\tKassimou\tChef de Village\tKoro\t0757790954\tReconduit\tHomme
16\tBAFING\tKoro\tDIOMANDE\tDaouda\tChef de Village\tBooko\t0748000823\tReconduit\tHomme
17\tBAFING\tOuaninou\tBAMBA\tSoty\tChef de Canton\tKawa\t0709160203\tNouveau\tHomme
18\tBAFING\tOuaninou\tDIOMANDE\tLacine\tChef de Canton\tToubako\t0707426058\tReconduit\tHomme
19\tBAFING\tTouba\tDIOMANDE\tZoumana\tChef de Canton\tCandessi\t0708925350\tNouveau\tHomme
20\tBAFING\tTouba\tFADIGA\tFamoussa\tChef de Canton\tTouba\t0757896488\tNouveau\tHomme
21\tBAGOUE\tBoundiali\tBAMBA\tLassana\tChef de Canton\tGbatoh\t0555686898\tReconduit\tHomme
22\tBAGOUE\tBoundiali\tKONE\tNofolossion\tChef de Village\tGbemou\t0701877661\tReconduit\tHomme
23\tBAGOUE\tKouto\tKONE\tSouhourou\tChef de Canton\tKouto\t0101668289\tReconduit\tHomme
24\tBAGOUE\tKouto\tLOZENI\tToure\tChef de Canton\tKolia\t0708240204\tReconduit\tHomme
25\tBAGOUE\tTengréla\tCOULIBALY\tIssa\tChef de Canton\tTengrela\t0747656126\tNouveau\tHomme
26\tBAGOUE\tTengréla\tOUATTARA\tFankere\tChef de Village\tTengrela\t0749155590\tNouveau\tHomme
27\tBELIER\tDidiévi\tKOMOE\tKouadio\tChef de Village\tMbankassê\t0709116097\tReconduit\tHomme
28\tBELIER\tDidiévi\tN'DOLI\tYao N'Guessan Rodolphe\tChef de Tribu\tMolonou-Blé\t0778469793\tReconduit\tHomme
29\tBELIER\tDjékanou\tKOUAME\tYao Daniel\tChef de Village\tDjékanou\t0749700576\tReconduit\tHomme
30\tBELIER\tDjékanou\tM'BRA\tKouakou Remi\tChef de Village\tAngbavia\t0749184947\tReconduit\tHomme
31\tBELIER\tTiébissou\tKOFFI\tKouame\tChef de Canton\tAhitou\t0545059898\tNouveau\tHomme
32\tBELIER\tTiébissou\tKOUAKOU\tAmoin  Amélie\tChef de Tribu\tGrogro\t0778833046\tNouveau\tFemme
33\tBELIER\tToumodi\tKOFFI\tKouadio Désiré\tChef de Village\tTchimoukro\t0708262154\tNouveau\tHomme
34\tBELIER\tToumodi\tKOUAKOU\tKouadio\tChef de Village\tDida-Kouadiokro\t0749643528\tReconduit\tHomme
35\tBERE\tDianra\tDAO\tKassimou\tChef de Village\tKafegue\t0504400194\tReconduit\tHomme
36\tBERE\tDianra\tKONE\tDoteme\tChef de Canton\tGbatoh\t0556272435\tReconduit\tHomme
37\tBERE\tKounahiri\tBAGATE\tMeboua\tChef de Canton\tTofesso\t0747532191\tReconduit\tHomme
38\tBERE\tKounahiri\tKAWA\tBomisso\tChef de Canton\tKounahiri\t0142510833\tReconduit\tHomme
39\tBERE\tMankono\tKANDE\tAmara\tChef de Canton\tOuedallah\t0101589030\tReconduit\tHomme
40\tBERE\tMankono\tTIOTE\tMamadou\tChef de Canton\tPokoutou\t0707569941\tReconduit\tHomme
41\tBOUNKANI\tBouna\tOUATTARA\tBelegnonou\tChef de Village\tKoflandé\t0505226424\tReconduit\tHomme
42\tBOUNKANI\tBouna\tOUATTARA\tHinissiekoun\tChef de Village\tYallo\t0708507259\tReconduit\tHomme
43\tBOUNKANI\tDoropo\tBEBE\tKambiré\tChef de Village\tTalo\t\tNouveau\tHomme
44\tBOUNKANI\tDoropo\tOUATTARA\tBognory\tChef de Village\tDoropo\t\tReconduit\tHomme
45\tBOUNKANI\tNassian\tKOBENAN\tYao Kindo Alain\tChef de Village\tNassian\t0708180323\tReconduit\tHomme
46\tBOUNKANI\tNassian\tKOUADIO\tDongo\tChef de Canton\tBodé\t0555737522\tReconduit\tHomme
47\tBOUNKANI\tTéhini\tNOUFE\tToh\tChef de Village\tVontchon\t0709354728\tNouveau\tHomme
48\tBOUNKANI\tTéhini\tOUATTARA \tKarim\tChef de Village\tTehini\t0711550219\tReconduit\tHomme
49\tCAVALLY\tBloléquin\tBIE\tGlaou Laurent\tChef de Village\tGuéya\t0707301187\tReconduit\tHomme
50\tCAVALLY\tBloléquin\tBLO\tEtienne\tChef de Village\tBloléquin-village\t0709656615\tReconduit\tHomme
51\tCAVALLY\tGuiglo\tDJI\tEmile\tChef de Village\tYaoudé\t0708461645\tNouveau\tHomme
52\tCAVALLY\tGuiglo\tOULAI\tDoue Edmond\tChef de Village\tNiouldé\t0747338823\tReconduit\tHomme
53\tCAVALLY\tTaï\tGUI\tFrancois\tChef de Village\tGahably\t0708236779\tReconduit\tHomme
54\tCAVALLY\tTaï\tYAGNON\tValentin\tChef de Village\tGouléako II\t0576136545\tNouveau\tHomme
55\tCAVALLY\tToulepleu\tDAU\tJacques\tChef de Tribu\tBloawia\t0758161393\tNouveau\tHomme
56\tCAVALLY\tToulepleu\tTE \tJean Claude\tChef de Village\tSeizaibli\t0707393860\tNouveau\tHomme
57\tFOLON\tKaniasso\tDIARRASSOUBA\tSouleymane\tChef de Village\tKaniasso\t0707383171\tNouveau\tHomme
58\tFOLON\tKaniasso\tKONE\tDramane\tChef de Canton\tGoulia\t0544326988\tNouveau\tHomme
59\tFOLON\tMinignan\tSANGARE\tMamadou\tChef de Village\tMinignan\t0556755433\tReconduit\tHomme
60\tFOLON\tMinignan\tSIDIBE\tKarim\tChef de Village\tTienkô\t0749234553\tNouveau\tHomme
61\tGBEKE\tBéoumi\tANDOH\tKoffi N'Da Siméon \tChef de Village\tAlloukou-Yakro\t0707102009\tNouveau\tHomme
62\tGBEKE\tBéoumi\tYAO\tKoffi Barthelemy\tChef de Canton\tKodê\t0708106408\tReconduit\tHomme
63\tGBEKE\tBotro\tKOUASSI\tYao Thomas\tChef de Canton\tGblo Mamela\t0707808390\tReconduit\tHomme
64\tGBEKE\tBotro\tTOTOKRA\tKouakou Édouard \tChef de Canton\tSatiklan\t0707838250\tNouveau\tHomme
65\tGBEKE\tBouaké\tKONAN\tBrou\tChef de Canton\tPrepressou\t0748323655\tNouveau\tHomme
66\tGBEKE\tBouaké\tNGUESSAN \tYoboue\tChef de Canton\tDohoun\t0708704610\tNouveau\tHomme
67\tGBEKE\tSakassou\tKOUASSI\tN'Dri\tChef de Village\tKomokonouan\t0707259297\tReconduit\tHomme
68\tGBEKE\tSakassou\tN’GUESSAN\tKouassi Djea\tChef de Village\tKpetebonouan\t0707514147\tReconduit\tHomme
69\tGBOKLE\tFresco\tBEUGRE\tDagaud Guy Desire\tChef de Village\tGomeneberi\t0575197877\tReconduit\tHomme
70\tGBOKLE\tFresco\tN'DRIN\tBogui Raphael\tChef de Village\tZanéko\t0707044589\tReconduit\tHomme
71\tGBOKLE\tSassandra\tGRAH\tMoni\tChef de Village\tNiega\t0747015423\tNouveau\tHomme
72\tGBOKLE\tSassandra\tOPIAH\tFrançois\tChef de Canton\tKodia\t0505208924\tNouveau\tHomme
73\tGOH\tGagnoa\tDAGO\tJoachim Boga\tChef de Tribu\tGnalégribouo / Djérégou\t0707537778\tNouveau\tHomme
74\tGOH\tGagnoa\tGADJI\tDagbo Joseph\tChef de Canton\tGodelilié / Gnébié\t0707638878\tReconduit\tHomme
75\tGOH\tOumé\tKOFFI\tDiby Guy Hollang\tChef de Village\tYahofla\t0709128905\tReconduit\tHomme
76\tGOH\tOumé\tKOUAME\tYobo\tChef de Village\tBadié\t0748692322\tReconduit\tHomme
77\tGONTOUGO\tBondoukou\tBINI\tKouakou\tChef de Village\tBinda\t0707843673\tReconduit\tHomme
78\tGONTOUGO\tBondoukou\tKOUADJO\tYeboua\tChef de Province\t\t0707939494\tReconduit\tHomme
79\tGONTOUGO\tKoun-Fao\tKOUABENAN\tBrindoumi Gregoire\tChef de Village\tKrakro\t0758261348\tReconduit\tHomme
80\tGONTOUGO\tKoun-Fao\tKOUADIO\tHoussou\tChef de Village\tN'gorato\t0707954897\tReconduit\tHomme
81\tGONTOUGO\tSandégué\tOUATTARA\tBamorou\tChef de Village\tDimandougou\t0778730126\tReconduit\tHomme
82\tGONTOUGO\tSandégué\tOUATTARA\tAlliagui\tChef de Canton\tSandegué\t0707734130\tReconduit\tHomme
83\tGONTOUGO\tTanda\tKOBENAN\tGboko\tChef de Village\tKorokobango\t0707047135\tReconduit\tHomme
84\tGONTOUGO\tTanda\tKOFFI\tMouroufie Norbert\tChef de Canton\tKetan\t0707709365\tReconduit\tHomme
85\tGONTOUGO\tTransua\tKOUAKOU\tIgnace\tChef de Canton\tTransua\t0707933708\tReconduit\tHomme
86\tGONTOUGO\tTransua\tYAO\tKouaf\tChef de Village\tAssueffry\t0707643670\tReconduit\tHomme
87\tGRANDS-PONTS\tDabou\tAGNIMEL\tYedess Laurent\tChef de Village\tBouboury\t0141777933\tReconduit\tHomme
88\tGRANDS-PONTS\tDabou\tYEDAGNE\tDe Phillipe\tChef de Village\tPandaa\t0707096416\tReconduit\tHomme
89\tGRANDS-PONTS\tGrand-Lahou\tKPAGNE\tAboure Emmanuel\tChef de Village\tLikpilassé\t0152530942\tReconduit\tHomme
90\tGRANDS-PONTS\tGrand-Lahou\tZOUKOUAN\tKokora Gabriel\tChef de Village\tN'Zida\t0101390507\tReconduit\tHomme
91\tGRANDS-PONTS\tJacqueville\tDAGRI\tN’Guessan Celestin\tChef de Village\tBahuama\t0757690942\tReconduit\tHomme
92\tGRANDS-PONTS\tJacqueville\tOBOUAYEBA\tSamuel\tChef de Village\tKoko\t0708385965\tReconduit\tHomme
93\tGUEMON\tBangolo\tBAH \tBéla Léopold\tChef de Village\tBahibly\t0585228893\tNouveau\tHomme
94\tGUEMON\tBangolo\tTAHA\tSérou Bruno\tChef de Canton\tZagna et Yably Guinglo\t0709552095\tNouveau\tHomme
95\tGUEMON\tDuékoué\tDIEGAI\tBoblahet Zacharie\tChef de Village\tFangolo\t0708254123\tNouveau\tHomme
96\tGUEMON\tDuékoué\tDJEHE \tDessiéhi Etienne\tChef de Canton\tZagné et Bagohouo\t0749276990\tNouveau\tHomme
97\tGUEMON\tFacobly\tBOLOU\tJean Modeste\tChef de Tribu\tMinlo\t0769258005\tNouveau\tHomme
98\tGUEMON\tFacobly\tTEHOUE \tMesmin Sylvain Pahiet\tChef de Tribu\tSoho\t0707487503\tNouveau\tHomme
99\tGUEMON\tKouibly\tGNONDIE\tMonnehon Benjamin\tChef de Village\tGuinglo-ville\t0758707021\tNouveau\tHomme
100\tGUEMON\tKouibly\tPOTE \tMoussa Ismael\tChef de Tribu\tNidrou\t0708006347\tNouveau\tHomme
101\tHAMBOL\tDabakala\tCOULIBALY\tFatogoma\tChef de Canton\tSatama-Sokoro\t0757882528\tReconduit\tHomme
102\tHAMBOL\tDabakala\tOUATTARA\tSina\tChef de Canton\tSokoura\t0749534529\tReconduit\tHomme
103\tHAMBOL\tKatiola\tCOULIBALY\tTiemoko\tChef de Canton\tFronan\t0505594119\tReconduit\tHomme
104\tHAMBOL\tKatiola\tOUATTARA\tWaogninlin\tChef de Village\tPédiakaha\t0757830372\tReconduit\tHomme
105\tHAMBOL\tNiakaramadougou\tCOULIBALY\tKpotery\tChef de Village\tTafiré\t0707824443\tNouveau\tHomme
106\tHAMBOL\tNiakaramadougou\tKONE\tTalnan\tChef de Canton\tNiakara\t0709349781\tReconduit\tHomme
107\tHAUT SASSANDRA\tDaloa\tKEKE\tAhipo\tChef de Village\tBaléa 2\t0759840363\tReconduit\tHomme
108\tHAUT SASSANDRA\tDaloa\tZAN \tBi Kouadio\tChef de Village\tFaazra\t0709097313\tReconduit\tHomme
109\tHAUT SASSANDRA\tIssia\tGAMA \tYoh\tChef de Village\tGazéhio\t0758372174\tNouveau\tHomme
110\tHAUT SASSANDRA\tIssia\tIpaud Lago\tPierre Michel\tChef de Village\tLiga\t0505057704\tNouveau\tHomme
111\tHAUT SASSANDRA\tVavoua\tBOUELY\tBi Bohié Hervé\tChef de Canton\tSétis et Bohifla\t0708023317\tReconduit\tHomme
112\tHAUT SASSANDRA\tVavoua\tGBESSI \tMathurin Séri\tChef de Village\tFiankon\t0594056704\tNouveau\tHomme
113\tHAUT SASSANDRA\tZoukougbeu\tGUINA \tLago Bertin\tChef de Village\tBagro 2\t0709981749\tReconduit\tHomme
114\tHAUT SASSANDRA\tZoukougbeu\tZEDE\tYves\tChef de Village\tDétroya\t0709727204\tNouveau\tHomme
115\tIFFOU\tDaoukro\tKOUADIO\tKonan\tChef de Village\tAnoumabo S/P Daoukro\t0758591602\tNouveau\tHomme
116\tIFFOU\tDaoukro\tKOUAME\tKoffi Eugene\tChef de Village\tDaoukro S/P Daoukro\t0708452055\tReconduit\tHomme
117\tIFFOU\tM’bahiakro\tESSE\tKouakou\tChef de Village\tkouassikro S/P MBahi\t0707419778\tReconduit\tHomme
118\tIFFOU\tM’bahiakro\tKOUAKOU\tKouame Jean Baptiste\tChef de Village\tAmankro S/P MBahiakro\t0707019441\tNouveau\tHomme
119\tIFFOU\tOuellé\tKOFFI \tKouassi\tChef de Village\tBedie-komenankro\t0707540909\tNouveau\tHomme
120\tIFFOU\tOuellé\tKOMENAN\tIpou\tChef de Tribu\tNgbogbo-kotoko\t0707025086\tNouveau\tHomme
121\tIFFOU\tPrikro\tABOU\tAdama Kouassi Ouattara\tChef de Village\tSerebou S/P Famienkro\t0709302206\tNouveau\tHomme
122\tIFFOU\tPrikro\tSIAKA\tOumar\tChef de Village\tTetessi S/P Nafanan\t0707485897\tReconduit\tHomme
123\tINDENIE-DJUABLIN\tAbengourou\tANEY\tFirmin\tChef de Village\tBokakokoré\t0707598737\tReconduit\tHomme
124\tINDENIE-DJUABLIN\tAbengourou\tASSALE\tKouassi Victor\tChef de Canton\tNiablé\t0707899714\tReconduit\tHomme
125\tINDENIE-DJUABLIN\tAgnibilékrou\tEPONON\tKouame Adolphe\tChef de Village\tDamé\t0707877604\tReconduit\tHomme
126\tINDENIE-DJUABLIN\tAgnibilékrou\tN'GUESSAN\tBrou Raymond\tChef de Village\tKongodia\t0707621161\tReconduit\tHomme
127\tINDENIE-DJUABLIN\tBéttié\tCOBRI\tAnini\tChef de Village\tAkebri\t0709004335\tReconduit\tHomme
128\tINDENIE-DJUABLIN\tBéttié\tKOUA \tSawou\tChef de Canton\tBettié\t0747851145\tNouveau\tHomme
129\tKABADOUGOU\tGbéléban\tTOURE\tLaciné\tChef de Village\tKogonan\t0546337350\tReconduit\tHomme
130\tKABADOUGOU\tGbéléban\tTRAORE\tYoussoufou\tChef de Village\tGbéléban\t0545779798\tReconduit\tHomme
131\tKABADOUGOU\tMadinani\tKONE\tYaya\tChef de Village\tMadinani\t0708634558\tReconduit\tHomme
132\tKABADOUGOU\tMadinani\tSANGARE\tVamoussa\tChef de Canton\tFladougo\t0555825478\tReconduit\tHomme
133\tKABADOUGOU\tOdiénné\tDIARRASSOUBA\tDoumbia Inza\tChef de Canton\tNafana\t0505151489\tReconduit\tHomme
134\tKABADOUGOU\tOdiénné\tYOUSSOUF\tKone\tChef de Canton\tSienkô\t0747544582\tReconduit\tHomme
135\tKABADOUGOU\tSamatiguila\tDIABY\tMamadou\tChef de Village\tSamatiguila\t0707854840\tNouveau\tHomme
136\tKABADOUGOU\tsamatiguila\tSANOGO\tBrahima\tChef de Village\tSanogobra-Mafélé\t0768081256\tReconduit\tHomme
137\tKABADOUGOU\tSéguélon\tKONE\tBaba\tChef de Canton\tSeguelon\t0748087832\tNouveau\tHomme
138\tKABADOUGOU\tSéguélon\tKONE\tIssiaka\tChef de Village\tLingoho\t0708438862\tNouveau\tHomme
139\tLA ME\tAdzopé\tASSI\tYapo\tChef de Village\tNyan\t0748727395\tNouveau\tHomme
140\tLA ME\tAdzopé\tYAPO\tGbocho Hyacinthe\tChef de Village\tMiadzin\t5743070763\tReconduit\tHomme
141\tLA ME\tAkoupé\tASSI\tDian\tChef de Village\tAkoupé 2\t0708297655\tNouveau\tHomme
142\tLA ME\tAkoupé\tKOUASSI \tN'guessan Luc\tChef de Village\tAdikokoi\t0707680897\tNouveau\tHomme
143\tLA ME\tAlépé\tKOUAHO \tMartin Narcisse Adja\tChef de Village\tAlépé\t0749773362\tNouveau\tHomme
144\tLA ME\tAlépé\tNIAMIEN\tAdou Mathurin\tChef de Village\tAboisso - Comoé\t0546063490\tNouveau\tHomme
145\tLA ME\tYakassé-Attobrou\tBERRY\tSeka Pierre-Dieudonne\tChef de Canton\tAttobrou\t0707028086\tReconduit\tHomme
146\tLA ME\tYakassé-Attobrou\tYAPO\tYapi Barnabe\tChef de Village\tKong 1\t0708154794\tReconduit\tHomme
147\tLOH-DJIBOUA\tDivo\tANY\tGbetto Moïse\tChef de Village\tHiré\t0707985610\tNouveau\tHomme
148\tLOH-DJIBOUA\tDivo\tKOFFI\tAhou Marceline\tChef de Canton\tZego\t0747698654\tReconduit\tFemme
149\tLOH-DJIBOUA\tGuitry\tGNEBLO\tBlapka\tChef de Village\tMéné s/p Yacobou\t0708194744\tNouveau\tHomme
150\tLOH-DJIBOUA\tGuitry\tSAMON\tGodo Abry\tChef de Canton\tKobouo\t0707481834\tNouveau\tHomme
151\tLOH-DJIBOUA\tLakota\tGOLI\tNanebo Paul\tChef de Canton\tAkabreboua\t0747916050\tReconduit\tHomme
152\tLOH-DJIBOUA\tLakota\tLEDJOU\tGnakouri\tChef de Village\tNiémanakoya\t0756667190\tReconduit\tHomme
153\tMARAHOUE\tBonon\tBI\tGooré Néné\tChef de Tribu\tBonon\t0708787264\tNouveau\tHomme
154\tMARAHOUE\tBonon\tBI\tGouri Djangoné \tChef de Tribu\tGonan\t0749013010\tNouveau\tHomme
155\tMARAHOUE\tBouaflé\tBI \tOuai Léon Hué \tChef de Village\tKoblata\t0757020171\tNouveau\tHomme
156\tMARAHOUE\tBouaflé\tN'Dia\tCoffi Georges Léon\tChef de Canton\tAyaou\t0707073532\tNouveau\tHomme
157\tMARAHOUE\tGohitafla\tTA\tBi Trayé \tChef de Canton\tBeis\t0709995845\tNouveau\tHomme
158\tMARAHOUE\tGohitafla\tYOUAN\tBi Youan\tChef de Village\tManfla\t0709488000\tNouveau\tHomme
159\tMARAHOUE\tSinfra\tZAHOUO\tBi Bia Jean-Baptiste\tChef de Tribu\tNanan\t0748112717\tNouveau\tHomme
160\tMARAHOUE\tSinfra\tZAKOUTA \tBi  Kalé Mathias\tChef de Tribu\tSian\t0143659391\tReconduit\tHomme
161\tMARAHOUE\tZuénoula\tVANIE\tBi Zamble Julien\tChef de Tribu\tBouénou\t0707170306\tNouveau\tHomme
162\tMARAHOUE\tZuénoula\tBI \tTra Mathurin Voli\tChef de Tribu\tDuonon\t0707912309\tNouveau\tHomme
163\tMORONOU\tArrah\tN'GANZA\tAhissan Olivier\tChef de Tribu\tAhua\t0708852248\tNouveau\tHomme
164\tMORONOU\tArrah\tTANOH\tOi Tanoh Jean \tChef de Village\tErobo\t0748479530\tReconduit\tHomme
165\tMORONOU\tBongouanou\tKOUADIO\tOi Kouadio\tChef de Village\tAgbossou S/P Ande\t0707441586\tReconduit\tHomme
166\tMORONOU\tBongouanou\tKOUAME\tAkpegni Pierre\tChef de Village\tBocaci S/P Bongouanou\t0748335006\tReconduit\tHomme
167\tMORONOU\tM’Batto\tKAMANAN \tAssoua\tChef de Tribu\tAllangoua S/P Assahara\t0707910084\tReconduit\tHomme
168\tMORONOU\tM’Batto\tOUA\tBoni Noel Boni\tChef de Tribu\t\t0709088188\tReconduit\tHomme
169\tN’ZI\tBocanda\tELLE\tKouakou Theodore\tChef de Village\tDida-Kayabo S/P Bocanda\t0707805668\tReconduit\tHomme
170\tN’ZI\tBocanda\tKOUAKOU\tLokossue\tChef de Village\tAbeanou S/P Kouadioblékro\t0708719773\tReconduit\tHomme
171\tN’ZI\tDimbokro\tKOUASSI\tKoffi\tChef de Tribu\tSakiaré S/P Djagoko\t0708477039\tReconduit\tHomme
172\tN’ZI\tDimbokro\tN'DRI\tKouakou\tChef de Village\tKomien Kouassikro S/P Abidji\t0707867164\tReconduit\tHomme
173\tN’ZI\tKouassi-Kouassikro\tADI\tKoffi Narcisse\tChef de Village\tAdikoffikro S/P Mekro\t0709774600\tReconduit\tHomme
174\tN’ZI\tKouassi-Kouassikro\tKOFFI\tKouadio Augustin\tChef de Village\tAdikoffikro S/P Kcro\t0708748431\tNouveau\tHomme
175\tNAWA\tBuyo\tGATTA\tTape\tChef de Village\tWonsealy V2\t0709173572\tReconduit\tHomme
176\tNAWA\tBuyo\tLIADE\tEmile\tChef de Village\tLoboville\t0707355841\tNouveau\tHomme
177\tNAWA\tGuéyo\tGBAKA\tDakouri Germain\tChef de Village\tBakadou s/p Dabouyo\t0748103384\tReconduit\tHomme
178\tNAWA\tGuéyo\tGNALI\tGnakouri Michel\tChef de Village\tBrétihio s/p Guéyo\t0749170050\tReconduit\tHomme
179\tNAWA\tMéagui\tNETRO\tBarthelemy\tChef de Village\tMéagui\t0708541631\tReconduit\tHomme
180\tNAWA\tMéagui\tVAKA\tKple Kpeule\tChef de Canton\tGnamagni / Bakoué de la Nawa\t0708010820\tReconduit\tHomme
181\tNAWA\tSoubré\tGBALLE\tZadou Jean-Paul\tChef de Village\tGuiméyo\t0707353051\tReconduit\tHomme
182\tNAWA\tSoubré\tMAGUI\tJean-Claude\tChef de Village\tGabaguhé\t0748236957\tNouveau\tHomme
183\tPORO\tDikodougou\tSORO\tOuanan Lazare\tChef de Canton\tDikodougou\t0707349415\tReconduit\tHomme
184\tPORO\tDikodougou\tYEO\tDonikporo\tChef de Canton\tGuiembé\t0707709252\tReconduit\tHomme
185\tPORO\tKorhogo\tCOULIBALY\tBakary\tChef de Canton\tKomborodougou\t0506016072\tReconduit\tHomme
186\tPORO\tKorhogo\tSILUE\tNamitin\tChef de Village\tTioroniaradougou\t0584705525\tNouveau\tHomme
187\tPORO\tM’Bengué\tCOULIBALY\tBanako\tChef de Canton\tM'bengué\t0707889362\tNouveau\tHomme
188\tPORO\tM’Bengué\tCOULIBALY\tZanifigué\tChef de Village\tM'bengué\t0709745587\tNouveau\tHomme
189\tPORO\tSinématiali\tCOULIBALY\tTiémoko Yadé Dominique\tChef de Canton\tSinématiali\t0758818280\tNouveau\tHomme
190\tPORO\tSinématiali\tSILUE\tTiandiogo Dit Kone Samba\tChef de Canton\tKagbolodougou\t0748313151\tReconduit\tHomme
191\tSAN PEDRO\tSan-pédro\tHEMY\tDaniel\tChef de Village\tMagné\t0779325351\tReconduit\tHomme
192\tSAN PEDRO\tSan-pédro\tKAH\tToh\tChef de Canton\tDoba\t0707782685\tReconduit\tHomme
193\tSAN PEDRO\tTabou\tHIANNON\tBarou Aimé\tChef de Canton\tBAPO\t0707261613\tReconduit\tHomme
194\tSAN PEDRO\tTabou\tHINE\tBeugle\tChef de Village\tOMBLOKE\t0747614450\tReconduit\tHomme
195\tSUD COMOE\tAboisso\tENAN\tEboua Francis\tRoi\tSanwi\t0707993586\tNouveau\tHomme
196\tSUD COMOE\tAboisso\tTANO-BIAN\tAka\tChef de Village\tMaféré\t0707086486\tReconduit\tHomme
197\tSUD COMOE\tAdiaké\tANIMA\tAka\tRoi\tBétibés (Adiaké)\t0747958101\tReconduit\tHomme
198\tSUD COMOE\tAdiaké\tEBY\tKouame\tRoi\tEssouma (Assinie)\t0708092619\tReconduit\tHomme
199\tSUD COMOE\tGrand-Bassam\tMANZAN\tJules\tChef de Village\tAzuretti\t0747854974\tReconduit\tHomme
200\tSUD COMOE\tGrand-Bassam\tMIEZAN\tKacou Venance\tRoi\tBonoua\t0788881509\tNouveau\tHomme
201\tSUD COMOE\tTiapoum\tKOUASSI\tN’Daffo\tRoi\tTiapoum\t0574472431\tReconduit\tHomme
202\tSUD COMOE\tTiapoum\tNiamké \tNiamké\tChef de Village\tEboko\t0709466377\tNouveau\tHomme
203\tTCHOLOGO\tFerkéssédougou\tKONE\tMamadou Jonas\tChef de Canton\tFerkessédougou\t0707670348\tReconduit\tHomme
204\tTCHOLOGO\tFerkéssédougou\tOUATTARA\tPerogniguélé Benjamin\tChef de Canton\tKoumbala\t0707281378\tNouveau\tHomme
205\tTCHOLOGO\tKong\tBAMBA\tTiemoko\tChef de Village\tKafolo\t0747581529\tReconduit\tHomme
206\tTCHOLOGO\tKong\tOUATTARA\tFotié\tChef de Village\tKong\t0708567885\tNouveau\tHomme
207\tTCHOLOGO\tOuangolodougou\tOUATTARA\tSiaka\tChef de Village\tOuangolodougou\t0747061597\tReconduit\tHomme
208\tTCHOLOGO\tOuangolodougou\tOUATTARA\tMamadou\tChef de Village\tTorla\t0709777612\tReconduit\tHomme
209\tTONKPI\tBiankouma\tCHERIFOU\tBanketa\tChef de Canton\tToura\t0707451886\tReconduit\tHomme
210\tTONKPI\tBiankouma\tDRO\tDiomande\tChef de Village\tBiankouma Village\t0709288462\tReconduit\tHomme
211\tTONKPI\tDanané\tTIOMIN\tAugustin\tChef de Canton\tOuiné\t0709800240\tReconduit\tHomme
212\tTONKPI\tDanané\tYAKE\tAdama\tChef de Canton\tGourressé\t0749677349\tReconduit\tHomme
213\tTONKPI\tMan\tGONCE\tPierre\tChef de Canton\tMan-Campagne\t0747382581\tReconduit\tHomme
214\tTONKPI\tMan\tGUEU\tEmmanuel\tChef de Village\tGuianlé\t0708318811\tReconduit\tHomme
215\tTONKPI\tSipilou\tDIOMANDE\tAubin\tChef de Canton\tSipilou\t0747908297\tReconduit\tHomme
216\tTONKPI\tSipilou\tSOUMAHORO\tDroh Paul\tChef de Village\tZocoma\t0769369929\tReconduit\tHomme
217\tTONKPI\tZouan-Hounien\tGOUN\tTieu Gerard\tChef de Canton\tBlossé\t0709659377\tReconduit\tHomme
218\tTONKPI\tZouan-Hounien\tTOMA\tLucien\tChef de Canton\tLollé\t0708819989\tReconduit\tHomme
219\tWORODOUGOU\tKani\tBAKAYOKO\tKrobla\tChef de Canton\tKani\t0709356745\tReconduit\tHomme
220\tWORODOUGOU\tKani\tBAMBA\tAbdoulaye\tChef de Village\tSoba\t0708170925\tNouveau\tHomme
221\tWORODOUGOU\tSéguéla\tKONE \tEl Hadj Métiéoulé\tChef de Village\tKamalo\t0757007325\tNouveau\tHomme
222\tWORODOUGOU\tSéguéla\tDIOMANDE\tNamory\tChef de Village\tFarafing\t0757898032\tNouveau\tHomme`;

const lines = rawTsv.trim().split('\n');
const header = lines[0].split('\t');

const parsed = [];

for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split('\t');
    if (!row || row.length < 5) continue;

    const num = parseInt(row[0].trim(), 10);
    const region = row[1].trim();
    const department = row[2].trim();
    const lastName = row[3].trim();
    const firstName = row[4].trim();
    const qualite = (row[5] || '').trim();
    const localite = (row[6] || '').trim();
    const contact = (row[7] || '').trim();
    const profile = (row[8] || '').trim();
    const sexe = (row[9] || '').trim();

    let fullRole = qualite;
    if (localite) {
        if (qualite.toLowerCase().includes('chef') || qualite.toLowerCase().includes('roi')) {
            fullRole = `${qualite} / ${localite}`;
        } else {
            fullRole = `${qualite} ${localite}`;
        }
    }

    parsed.push({
        num,
        region,
        department,
        lastName,
        firstName,
        qualite,
        locality: localite,
        role: fullRole,
        contact,
        profile,
        sexe
    });
}

console.log(`Total membres parsés : ${parsed.length}`);

// Write parsed JSON to data/comites_regionaux_actifs_2026.json
const jsonPath = path.join(process.cwd(), 'data', 'comites_regionaux_actifs_2026.json');
fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf8');
console.log(`Fichier JSON écrit avec succès : ${jsonPath}`);

// Write TSV to data/comites_regionaux_2026.tsv
const tsvPath = path.join(process.cwd(), 'data', 'comites_regionaux_2026.tsv');
fs.writeFileSync(tsvPath, rawTsv, 'utf8');
console.log(`Fichier TSV écrit avec succès : ${tsvPath}`);
