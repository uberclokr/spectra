/* ── Authorities ──────────────────────────────────────────────────────────────
   Each non-FCC authority is the FCC base with patch spans replaced.
   patch: [spanLoHz, spanHiHz, [band records tiling the span]]
   landmarks: [lo, hi, label, tour?] — tour landmarks also become jump chips. */

const LM_WORLD = [
  [59.75*k,60.25*k,"Radio clocks",0],
  [1400*M,1427*M,"Hydrogen line",0],
  [121.5*M,121.5*M,"Guard 121.5",0],
  [156.8*M,156.8*M,"Channel 16",0],
  [406*M,406.1*M,"Rescue beacons",0],
  [1090*M,1090*M,"ADS-B",0],
  [1559*M,1610*M,"GPS / GNSS",1],
  [2400*M,2483.5*M,"2.4 GHz Wi-Fi",1],
  [2450*M,2450*M,"Microwave oven",0],
  [12.2*G,12.7*G,"Satellite TV",0],
  [57*G,71*G,"60 GHz WiGig",0],
  [76*G,81*G,"Car radar",1],
  [94*G,94*G,"Cloud radar",0],
  [174.8*G,191.8*G,"183 GHz sounder",0],
];

const AUTH = {

fcc: {
  name:"FCC", flag:"🇺🇸", country:"United States", region:"ITU Region 2",
  full:"Federal Communications Commission",
  about:"Independent US regulator since 1934. It governs commercial, state, and local spectrum; federal users (military, NOAA, NASA) answer to NTIA — the two-column split behind the famous wall chart this explorer is modeled on.",
  quirks:[
    "Invented spectrum auctions (1994) — the C-band sale alone raised $81 billion.",
    "CBRS three-tier sharing at 3.5 GHz is a world first: cloud referees admit users in priority order.",
    "Opened all 1200 MHz of 6 GHz to Wi-Fi in 2020 — the largest unlicensed grant ever.",
    "AM channels every 10 kHz and FM at 88–108 MHz: the Region 2 pattern.",
  ],
  patches:[],
  landmarks:[
    [525*k,1705*k,"AM dial",1],
    [9995*k,10005*k,"WWV",0],
    [5900*k,15800*k,"Shortwave",1],
    [26965*k,27405*k,"CB radio",1],
    [88*M,108*M,"FM dial",1],
    [108*M,137*M,"Airband",1],
    [156*M,162.05*M,"Marine VHF",1],
    [162.4*M,162.55*M,"NOAA Weather",0],
    [462.55*M,467.725*M,"FRS/GMRS",0],
    [470*M,608*M,"TV broadcast",1],
    [902*M,928*M,"LoRa / Z-Wave",1],
    [3550*M,3700*M,"CBRS",1],
    [3700*M,3980*M,"C-band 5G",1],
    [5925*M,7125*M,"Wi-Fi 6E",1],
    [27.5*G,28.35*G,"5G mmWave",1],
  ],
},

ofcom: {
  name:"Ofcom", flag:"🇬🇧", country:"United Kingdom", region:"ITU Region 1",
  full:"Office of Communications",
  about:"The UK’s converged regulator (2003), heir to the Radiocommunications Agency. A pioneer of technology-neutral licences, spectrum trading, and local shared access — and the keeper of Europe’s longwave heritage.",
  quirks:[
    "BBC Radio 4 still broadcasts on 198 kHz longwave — a band the Americas never had.",
    "PMR446 gives Europe licence-free walkie-talkies in 0.2 MHz where the US has FRS in 25×.",
    "Hams get a 4 m band at 70 MHz that barely exists anywhere else.",
    "Shared Access licences let a factory or farm rent its own local 5G at 3.8–4.2 GHz.",
  ],
  patches:[
    [130*k,285*k,[
      [130*k,135.7*k,["FIXED","MARITIME MOBILE"]],
      [135.7*k,137.8*k,["FIXED","MARITIME MOBILE","Amateur"],"2200 m amateur","Same worldwide ham sliver as the US."],
      [137.8*k,148.5*k,["FIXED","MARITIME MOBILE"]],
      [148.5*k,283.5*k,["BROADCASTING"],"Longwave broadcast","BBC Radio 4 on 198 kHz — the Shipping Forecast, cricket, and the Radio Teleswitch that still flips electricity meters. Region 1 only: the Americas never had a longwave dial."],
      [283.5*k,285*k,["MARITIME RADIONAVIGATION"]],
    ]],
    [525*k,1800*k,[
      [525*k,1606.5*k,["BROADCASTING"],"MW broadcast","9 kHz channel raster (vs 10 kHz in the Americas). Home of talkSPORT and Absolute — and fading fast as Europe switches AM off."],
      [1606.5*k,1800*k,["FIXED","MOBILE"]],
    ]],
    [50*M,108*M,[
      [50*M,52*M,["AMATEUR"],"6 m amateur"],
      [52*M,70*M,["MOBILE","FIXED"],"Former TV Band I","405-line television lived at 45–68 MHz until 1985; business radio inherited the estate."],
      [70*M,70.5*M,["AMATEUR","MOBILE"],"4 m amateur","A UK speciality — most of the world has no 70 MHz ham band."],
      [70.5*M,74.8*M,["MOBILE","FIXED"]],
      [74.8*M,75.2*M,["AERONAUTICAL RADIONAVIGATION"],"75 MHz markers"],
      [75.2*M,87.5*M,["MOBILE","FIXED"],"","Private mobile radio mid-band."],
      [87.5*M,108*M,["BROADCASTING"],"FM broadcast","87.5–108 with RDS — a European invention. BBC nationals occupy 88–94.6."],
    ]],
    [174*M,230*M,[
      [174*M,230*M,["BROADCASTING"],"DAB Band III","UK radio’s digital home: DAB/DAB+ multiplexes in 1.712 MHz blocks. Television left Band III in 1985."],
    ]],
    [380*M,399.9*M,[
      [380*M,399.9*M,["MOBILE"],"TETRA emergency services","Airwave — the blue-light TETRA network — holds on here until the Emergency Services Network finally replaces it."],
    ]],
    [420*M,470*M,[
      [420*M,430*M,["RADIOLOCATION","FIXED","MOBILE"]],
      [430*M,440*M,["AMATEUR","RADIOLOCATION"],"70 cm amateur","10 MHz wide here versus 30 MHz in the US."],
      [440*M,446*M,["MOBILE","FIXED"]],
      [446*M,446.2*M,["MOBILE"],"PMR446","Europe’s licence-free walkie-talkie channels — the Region 1 answer to FRS."],
      [446.2*M,470*M,["MOBILE","FIXED"],"Business radio"],
    ]],
    [470*M,862*M,[
      [470*M,694*M,["BROADCASTING"],"Freeview DTT","Six DVB-T/T2 multiplexes carry ~100 channels; wireless mics rent the white spaces, and channel 38 (606–614) is reserved for programme-making entirely."],
      [694*M,790*M,["MOBILE"],"700 MHz 5G (n28)","Cleared of TV in 2020, auctioned 2021."],
      [790*M,862*M,["MOBILE"],"800 MHz 4G (n20)","The 2013 4G auction band, freed by analogue switch-off."],
    ]],
    [862*M,960*M,[
      [862*M,870*M,["MOBILE","Fixed"],"868 MHz SRD","Europe’s unlicensed sub-GHz: LoRaWAN, smart meters, key fobs — the mirror image of America’s 915 MHz.","i"],
      [870*M,876*M,["MOBILE","FIXED"]],
      [876*M,915*M,["MOBILE"],"GSM-R & 900 uplink","876–880 is railway GSM-R (train cab radio); above it, phones transmit (n8 up)."],
      [915*M,921*M,["MOBILE","Fixed"],"915 MHz SRD","A recently opened higher-power SRD/RFID window.","i"],
      [921*M,960*M,["MOBILE"],"900 MHz downlink","The band that made GSM a world standard in 1991."],
    ]],
    [1427*M,1525*M,[
      [1427*M,1452*M,["FIXED","MOBILE"]],
      [1452*M,1492*M,["MOBILE"],"L-band SDL (n32)","Downlink-only carriers that boost busy cells."],
      [1492*M,1525*M,["FIXED","MOBILE"]],
    ]],
    [1710*M,2025*M,[
      [1710*M,1785*M,["MOBILE"],"1800 MHz uplink (n3)","EE launched UK 4G here in 2012."],
      [1785*M,1805*M,["MOBILE"],"Duplex gap","Wireless microphones squat in the 1800 MHz duplex gap."],
      [1805*M,1880*M,["MOBILE"],"1800 MHz downlink (n3)"],
      [1880*M,1900*M,["MOBILE"],"DECT","Every cordless home phone in Europe."],
      [1900*M,1920*M,["MOBILE"],"Unpaired TDD","3G-auction leftovers, never much used."],
      [1920*M,1980*M,["MOBILE"],"2100 uplink (n1)","The £22.5 billion 3G auction of 2000 — telecoms’ dot-com fever dream."],
      [1980*M,2010*M,["MOBILE-SATELLITE (Earth-to-space)"],"MSS 2 GHz"],
      [2010*M,2025*M,["MOBILE"],"Unpaired TDD"],
    ]],
    [2110*M,2200*M,[
      [2110*M,2170*M,["MOBILE"],"2100 downlink (n1)"],
      [2170*M,2200*M,["MOBILE-SATELLITE (space-to-Earth)"],"MSS 2 GHz down"],
    ]],
    [2495*M,2690*M,[
      [2495*M,2500*M,["MOBILE-SATELLITE (space-to-Earth)"]],
      [2500*M,2570*M,["MOBILE"],"2.6 GHz uplink (n7)"],
      [2570*M,2620*M,["MOBILE"],"2.6 GHz TDD (n38)"],
      [2620*M,2690*M,["MOBILE"],"2.6 GHz downlink (n7)","4G capacity layer, auctioned 2013."],
    ]],
    [3300*M,4200*M,[
      [3300*M,3400*M,["RADIOLOCATION"]],
      [3400*M,3800*M,["MOBILE"],"3.4–3.8 GHz 5G (n78)","The UK’s main 5G band, auctioned in 2018 and 2021."],
      [3800*M,4200*M,["FIXED","FIXED-SATELLITE (space-to-Earth)"],"Shared Access","Ofcom’s local-licence scheme: anyone can rent private 5G for a factory, farm, or festival."],
    ]],
    [5925*M,7125*M,[
      [5925*M,6425*M,["FIXED","FIXED-SATELLITE (Earth-to-space)","MOBILE"],"Wi-Fi 6E (lower)","The UK opened only the lower 500 MHz, low-power indoor — half of what the FCC granted.","i"],
      [6425*M,7125*M,["FIXED","FIXED-SATELLITE (Earth-to-space)"],"Upper 6 GHz","Tug-of-war: Wi-Fi vs licensed 5G after WRC-23’s IMT identification. Ofcom is exploring hybrid sharing."],
    ]],
    [24.25*G,28.35*G,[
      [24.25*G,26.5*G,["FIXED","INTER-SATELLITE","EARTH EXPLORATION-SATELLITE"],"","Lower part of Europe’s 26 GHz pioneer band."],
      [26.5*G,27.5*G,["MOBILE"],"26 GHz 5G (n258)","Europe’s mmWave pioneer band, opened to UK licensees in 2025."],
      [27.5*G,28.35*G,["FIXED-SATELLITE (Earth-to-space)"],"Ka uplink","No 28 GHz 5G here, unlike the US — kept for satellite."],
    ]],
  ],
  landmarks:[
    [148.5*k,283.5*k,"Longwave",1],
    [525*k,1606.5*k,"MW dial",1],
    [5900*k,15800*k,"Shortwave",0],
    [87.5*M,108*M,"FM dial",1],
    [108*M,137*M,"Airband",1],
    [156*M,162.05*M,"Marine VHF",0],
    [174*M,230*M,"DAB radio",1],
    [446*M,446.2*M,"PMR446",1],
    [470*M,694*M,"Freeview TV",1],
    [862*M,870*M,"868 SRD / LoRa",1],
    [1880*M,1900*M,"DECT",0],
    [3400*M,3800*M,"5G n78",1],
    [5925*M,6425*M,"Wi-Fi 6E",1],
    [26.5*G,27.5*G,"26 GHz 5G",1],
  ],
},

mic: {
  name:"MIC", flag:"🇯🇵", country:"Japan", region:"ITU Region 3",
  full:"Ministry of Internal Affairs and Communications (総務省)",
  about:"Japan assigns spectrum through ministry allocation plans and comparative review — it is the only major economy that has never auctioned spectrum. It ran the world’s first commercial cellular network (Tokyo, 1979) and invented its own TV standard.",
  quirks:[
    "The FM dial runs 76–95 MHz — below everyone else’s. Imported cars needed “band expanders.”",
    "No spectrum auctions, ever: carriers are chosen by beauty contest.",
    "ISDB-T television, invented here, was adopted across most of South America.",
    "A uniquely Japanese 1.5 GHz cellular pair, and rare 4.5 GHz 5G (n79).",
  ],
  patches:[
    [525*k,1800*k,[
      [525*k,1606.5*k,["BROADCASTING"],"MW broadcast","9 kHz raster; NHK Radio 1 Tokyo runs 300 kW on 594 kHz. Most commercial AM stations are migrating to FM before the planned late-2020s sunset."],
      [1606.5*k,1800*k,["FIXED","MOBILE"]],
    ]],
    [76*M,108*M,[
      [76*M,95*M,["BROADCASTING"],"FM broadcast (76–95)","Japan’s FM dial starts at 76 MHz, lower than anywhere else. 90–95 is “wide FM,” added so AM stations could simulcast."],
      [95*M,108*M,["FIXED","MOBILE"],"Former TV ch 1–3","Analog VHF television until 2011; now public-safety and multimedia services."],
    ]],
    [470*M,960*M,[
      [470*M,710*M,["BROADCASTING"],"ISDB-T television","Japan’s own digital-TV standard; “1seg” pocket TV rode inside every channel."],
      [710*M,806*M,["MOBILE"],"700 MHz (n28)","The APT band plan shared across Asia-Pacific."],
      [806*M,915*M,["MOBILE"],"800/900 cellular","NTT’s original 800 MHz — the world’s first commercial cellular network started here in 1979."],
      [915*M,930*M,["MOBILE","Fixed"],"920 MHz LPWA","Japan’s sub-GHz IoT window: LoRa, Sigfox, and the Wi-SUN mesh reading the nation’s smart meters.","i"],
      [930*M,960*M,["MOBILE"],"900 MHz (n8)"],
    ]],
    [1427*M,1525*M,[
      [1427*M,1511*M,["MOBILE"],"1.5 GHz (n11/n21)","A cellular band pair used almost nowhere but Japan."],
      [1511*M,1525*M,["FIXED","MOBILE"]],
    ]],
    [1850*M,2025*M,[
      [1850*M,1880*M,["MOBILE"],"1.7 GHz downlink (n3)"],
      [1880*M,1920*M,["MOBILE"],"sXGP / former PHS","PHS — the beloved 90s “Pitch” pocket phone — retired in 2023; private LTE (sXGP) inherited the band."],
      [1920*M,1980*M,["MOBILE"],"2 GHz uplink (n1)"],
      [1980*M,2025*M,["MOBILE-SATELLITE","MOBILE"]],
    ]],
    [3300*M,4200*M,[
      [3300*M,3400*M,["RADIOLOCATION","FIXED"]],
      [3400*M,4100*M,["MOBILE"],"3.4–4.1 GHz 5G (n77/n78)","Main sub-6 5G, assigned by ministry review — no auction."],
      [4100*M,4200*M,["FIXED-SATELLITE (space-to-Earth)","FIXED"]],
    ]],
    [4400*M,4940*M,[
      [4400*M,4500*M,["FIXED","MOBILE"]],
      [4500*M,4600*M,["MOBILE"],"4.5 GHz 5G (n79)","NTT docomo’s extra mid-band — rare worldwide."],
      [4600*M,4940*M,["FIXED","MOBILE"]],
    ]],
    [5925*M,7125*M,[
      [5925*M,6425*M,["FIXED","FIXED-SATELLITE (Earth-to-space)","MOBILE"],"Wi-Fi 6E (lower)","Opened in 2022; the upper half remains under study.","i"],
      [6425*M,7125*M,["FIXED","FIXED-SATELLITE (Earth-to-space)"],"Upper 6 GHz","IMT vs Wi-Fi, still undecided."],
    ]],
    [25.25*G,29.5*G,[
      [25.25*G,26.5*G,["FIXED","INTER-SATELLITE"]],
      [26.5*G,29.5*G,["MOBILE"],"28 GHz 5G (n257)","All four carriers received 400 MHz each; “local 5G” licences let factories and campuses run their own."],
    ]],
  ],
  landmarks:[
    [525*k,1606.5*k,"MW dial (NHK)",1],
    [5900*k,15800*k,"Shortwave",0],
    [76*M,95*M,"FM dial 76–95",1],
    [108*M,137*M,"Airband",1],
    [156*M,162.05*M,"Marine VHF",0],
    [470*M,710*M,"ISDB-T TV",1],
    [915*M,930*M,"920 MHz LPWA",1],
    [1427*M,1511*M,"1.5 GHz (n11/21)",1],
    [1880*M,1920*M,"sXGP (ex-PHS)",0],
    [3400*M,4100*M,"5G n77/n78",1],
    [4500*M,4600*M,"5G n79",1],
    [5925*M,6425*M,"Wi-Fi 6E",1],
    [26.5*G,29.5*G,"28 GHz n257",1],
  ],
},

acma: {
  name:"ACMA", flag:"🇦🇺", country:"Australia", region:"ITU Region 3",
  full:"Australian Communications and Media Authority",
  about:"Regulator for a continent-sized country with a coastal population — outback AM transmitters cover areas the size of European states. ACMA’s “class licences” make entire bands licence-free by rule, and its APT700 band plan was adopted across Asia.",
  quirks:[
    "UHF CB at 476–477 MHz: 80 licence-free channels, the outback’s party line.",
    "Pioneered the APT700 band plan (703–803 MHz) that most of Asia now uses.",
    "Class licences legalize whole bands at once — no paperwork, just rules.",
    "Kept TV in VHF Band III alongside DAB+ — a squeeze most countries gave up on.",
  ],
  patches:[
    [525*k,1800*k,[
      [525*k,1606.5*k,["BROADCASTING"],"MW broadcast","9 kHz raster. Remote-area 50 kW stations serve listeners four hundred km away."],
      [1606.5*k,1800*k,["FIXED","MOBILE"]],
    ]],
    [76*M,108*M,[
      [76*M,87.5*M,["MOBILE","FIXED"],"","Land mobile mid-band."],
      [87.5*M,108*M,["BROADCASTING"],"FM broadcast","Triple J’s national youth network threads the whole dial."],
    ]],
    [174*M,230*M,[
      [174*M,230*M,["BROADCASTING"],"DTT VHF & DAB+","Australia kept television in Band III (ch 6–12) and squeezed DAB+ digital radio into channel 9A–9C gaps."],
    ]],
    [420*M,520*M,[
      [420*M,430*M,["RADIOLOCATION","FIXED","MOBILE"]],
      [430*M,450*M,["RADIOLOCATION","Amateur"],"70 cm amateur"],
      [450*M,470*M,["MOBILE","FIXED"],"Land mobile"],
      [470*M,476*M,["MOBILE","FIXED"]],
      [476*M,477*M,["MOBILE"],"UHF CB","80 licence-free channels — road trains, cattle stations, and 4WD convoys all run “40-channel.” Unique to Australia and New Zealand."],
      [477*M,520*M,["MOBILE","FIXED"],"Land mobile"],
    ]],
    [520*M,960*M,[
      [520*M,694*M,["BROADCASTING"],"DTT UHF","Digital television; the 694+ “digital dividend” went to mobile."],
      [694*M,803*M,["MOBILE"],"700 MHz (n28)","APT700 — the band plan Australia pioneered and Asia adopted."],
      [803*M,890*M,["MOBILE"],"850/900 cellular"],
      [890*M,915*M,["MOBILE"],"900 uplink"],
      [915*M,928*M,["Fixed","MOBILE","Radiolocation"],"915–928 ISM","LoRa and meters in the same window as the US — unlike Europe.","i"],
      [928*M,960*M,["MOBILE"],"900 downlink"],
    ]],
    [3300*M,3980*M,[
      [3300*M,3400*M,["RADIOLOCATION","Amateur"]],
      [3400*M,3700*M,["MOBILE"],"3.4–3.7 GHz 5G (n78)","Auctioned 2021, with area-wide licences for the bush."],
      [3700*M,3980*M,["FIXED-SATELLITE (space-to-Earth)","MOBILE"],"3.7 GHz","Opening in stages for metro 5G and regional wireless ISPs."],
    ]],
    [5925*M,7125*M,[
      [5925*M,6425*M,["FIXED","FIXED-SATELLITE (Earth-to-space)","MOBILE"],"Wi-Fi 6E (lower)","Class-licensed low-power indoor since 2022; ACMA is consulting on the upper half.","i"],
      [6425*M,7125*M,["FIXED","FIXED-SATELLITE (Earth-to-space)"],"Upper 6 GHz"],
    ]],
    [24.75*G,27.5*G,[
      [24.75*G,25.1*G,["FIXED","MOBILE"]],
      [25.1*G,27.5*G,["MOBILE"],"26 GHz 5G (n258)","Auctioned April 2021, plus a class licence for indoor mmWave — anyone may deploy."],
    ]],
  ],
  landmarks:[
    [525*k,1606.5*k,"AM dial",1],
    [26965*k,27405*k,"HF CB",0],
    [87.5*M,108*M,"FM dial",1],
    [108*M,137*M,"Airband",1],
    [156*M,162.05*M,"Marine VHF",0],
    [174*M,230*M,"TV & DAB+",1],
    [476*M,477*M,"UHF CB",1],
    [520*M,694*M,"DTT UHF",1],
    [915*M,928*M,"LoRa 915",1],
    [3400*M,3700*M,"5G n78",1],
    [5925*M,6425*M,"Wi-Fi 6E",1],
    [25.1*G,27.5*G,"26 GHz 5G",1],
  ],
},

ised: {
  name:"ISED", flag:"🇨🇦", country:"Canada", region:"ITU Region 2",
  full:"Innovation, Science and Economic Development Canada",
  about:"Canada’s spectrum branch runs one of the world’s most US-harmonized tables — phones roam the continent as one market — while auction prices per person rank among the planet’s highest.",
  quirks:[
    "The 2021 3500 MHz auction raised C$8.9 billion — world-leading per MHz-pop.",
    "Matched the US: all 1200 MHz of 6 GHz unlicensed (RSS-248).",
    "Weatheradio Canada broadcasts on the same seven 162 MHz channels as NOAA — bilingually.",
    "No CBRS: Canada chose conventional licensing at 3.5 GHz.",
  ],
  patches:[
    [162.025*M,174*M,[
      [162.025*M,174*M,["MOBILE","FIXED"],"Weatheradio","Environment Canada broadcasts on the same seven 162 MHz channels as NOAA — in English and French."],
    ]],
    [3450*M,3700*M,[
      [3450*M,3650*M,["MOBILE"],"3500 MHz flex-use (n78)","Canada’s 2021 auction raised C$8.9 B — no CBRS-style sharing, just licences."],
      [3650*M,3700*M,["MOBILE","FIXED"]],
    ]],
    [3700*M,3980*M,[
      [3700*M,3980*M,["MOBILE","FIXED-SATELLITE (space-to-Earth)"],"3800 MHz 5G","Auctioned 2023, following the US C-band clearing."],
    ]],
    [5925*M,7125*M,[
      [5925*M,7125*M,["FIXED","FIXED-SATELLITE (Earth-to-space)","MOBILE"],"Wi-Fi 6E/7","Canada matched the US grant: all 1200 MHz unlicensed — low-power indoor, standard power with AFC coordination.","i"],
    ]],
    [25.25*G,27.5*G,[
      [25.25*G,26.5*G,["FIXED","INTER-SATELLITE"]],
      [26.5*G,27.5*G,["MOBILE","FIXED"],"mmWave (planned)","Consultation under way, watching both the US 28 GHz and EU 26 GHz ecosystems."],
    ]],
  ],
  landmarks:[
    [525*k,1705*k,"AM dial",1],
    [88*M,108*M,"FM dial",1],
    [108*M,137*M,"Airband",1],
    [162.4*M,162.55*M,"Weatheradio",1],
    [462.55*M,467.725*M,"FRS/GMRS",0],
    [470*M,608*M,"TV broadcast",1],
    [902*M,928*M,"LoRa 915",1],
    [3450*M,3650*M,"3500 MHz 5G",1],
    [3700*M,3980*M,"3800 MHz 5G",1],
    [5925*M,7125*M,"Wi-Fi 6E/7",1],
  ],
},
};

/* ── Rulers ── */
const ITU_BANDS = [
  [3*k,30*k,"VLF","Very Low"],
  [30*k,300*k,"LF","Low"],
  [300*k,3*M,"MF","Medium"],
  [3*M,30*M,"HF","High"],
  [30*M,300*M,"VHF","Very High"],
  [300*M,3*G,"UHF","Ultra High"],
  [3*G,30*G,"SHF","Super High"],
  [30*G,300*G,"EHF","Extremely High"],
];
const IEEE_BANDS = [
  [1*G,2*G,"L"],[2*G,4*G,"S"],[4*G,8*G,"C"],[8*G,12*G,"X"],
  [12*G,18*G,"Ku"],[18*G,27*G,"K"],[27*G,40*G,"Ka"],[40*G,75*G,"V"],
  [75*G,110*G,"W"],[110*G,300*G,"mm"],
];
