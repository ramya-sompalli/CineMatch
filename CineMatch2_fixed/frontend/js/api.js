/**
 * CineMatch — Data Layer
 * Tries backend first, falls back to rich demo data with TMDB poster URLs
 */

const API_BASE = 'http://localhost:5000/api';

// ── TMDB image base (public, no key needed for display)
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

// ── Known TMDB poster paths (cached so we don't need API key on frontend)
// These are real TMDB poster paths that work without authentication
const TMDB_POSTERS = {
  278:    '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',  // Shawshank
  238:    '/3bhkrj58Vtu7enYsLLeqeNKOBOB.jpg',  // Godfather
  155:    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',  // Dark Knight
  424:    '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',  // Schindler's List
  680:    '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',  // Pulp Fiction
  550:    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',  // Fight Club
  27205:  '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',  // Inception
  603:    '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',  // Matrix
  769:    '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',  // Goodfellas
  13:     '/clolk7rB5lAjs0xusZAN1WNAFBL.jpg',  // Forrest Gump
  157336: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',  // Interstellar
  274:    '/rplLJ2hPcOQmkFhTqUte0MkosKe.jpg',  // Silence of Lambs
  496243: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',  // Parasite
  129:    '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',  // Spirited Away
  244786: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',  // Whiplash
  313369: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',  // La La Land
  6977:   '/4oqcSkQEhJBRlFSoGDLFl1mGrPK.jpg',  // No Country
  76341:  '/8tZYtuWezp3JiatB9O1X7PkEy5R.jpg',  // Mad Max
  152601: '/eCOtqtfvn7mxGaoDMCbgAFQBHAZ.jpg',  // Her
  194662: '/nX5XotM9yprCKarRH4fzcOssEFG.jpg',  // Grand Budapest
  376867: '/4911T5FbJ9eAlnGaTBDfcwxPMdD.jpg',  // Moonlight
  419430: '/tFXcEccSqMyp1B0S1OZ2j30xpMO.jpg',  // Get Out
  128:    '/4LaJMKgUeKLumHmXXFivQ0Pk4l4.jpg',  // Princess Mononoke
  38:     '/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg',  // Eternal Sunshine
  922:    '/ylGbs2mDQHD60lAoHVHiTSakBp0.jpg',  // Taxi Driver
  335984: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',  // Blade Runner 2049
  670:    '/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg',  // Oldboy
  37165:  '/vuza0WqY239yBXOadKlGwJsZJFE.jpg',  // Truman Show
  194:    '/yKnDFpMvQgkE6WXvPAb1gIlXlDe.jpg',  // Amélie
  62:     '/ve72VxNqsuIBOSOmfLW9LkdMikW.jpg',  // 2001
  1124:   '/bdN3gXuIZYaJP6o10o7GBQffWsW.jpg',  // The Prestige
  598:    '/k7eYdWvhYQyRQoU2TB2A2Xu2grZ.jpg',  // City of God
  68718:  '/7oWY8VDWW7thTzWh3OKYRkWAKdN.jpg',  // Django
  210577: '/n4sr6UhFKkU1QgFYOJkJjmHSEU3.jpg',  // Gone Girl
  77:     '/yuNs09hvpHVU1cQTCarTomosfruv.jpg',  // Memento
  1950:   '/4zfvKJQEXoq4mUVHaHhFXFO3gLK.jpg',  // Pan's Labyrinth
  545611: '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',  // EEAAO
  872585: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',  // Oppenheimer
  438631: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',  // Dune
  135397: '/igAsOTLiT3iFHmJHKlYpB5vKPNR.jpg',  // About Time
  546554: '/pThyQovXQrqVXB5oADAgGrmVB6b.jpg',  // Knives Out
  508442: '/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg',  // Soul
  354912: '/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg',  // Coco
  106646: '/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg',  // Wolf of Wall Street
  5765:   '/bc8a4b0hAJRWbGYPDFOxf2Ol3KD.jpg',  // Catch Me If You Can
  37799:  '/b9MkBCXqFJBckwKnbGLpkHlTFZp.jpg',  // Black Swan
  614934: '/nm2zFTLRUQAFRblNNLaFZFSYyaH.jpg',  // Portrait Lady on Fire
  674324: '/4yFG6cSPaCaPhyJ1vtGOiMV7qAa.jpg',  // Banshees
  423:    '/2hFvxCCWrTmCYwfy7yum0GKRi3Y.jpg',  // The Pianist
};

function posterUrl(tmdb_id) {
  const path = TMDB_POSTERS[tmdb_id];
  return path ? `${TMDB_IMG}${path}` : null;
}

// ── DEMO MOVIE DATA (50 curated films)
const DEMO_DATA = [
  {id:1,title:"The Shawshank Redemption",year:1994,genres:["Drama"],director:"Frank Darabont",cast:["Tim Robbins","Morgan Freeman"],rating:9.3,runtime:142,language:"English",country:"USA",plot:"Two imprisoned men bond over years finding solace and eventual redemption through acts of common decency.",mood:["Inspiring","Emotional","Hopeful"],era:"90s",style:"Character Study",votes:2700000,tmdb_id:278},
  {id:2,title:"The Godfather",year:1972,genres:["Crime","Drama"],director:"Francis Ford Coppola",cast:["Marlon Brando","Al Pacino"],rating:9.2,runtime:175,language:"English",country:"USA",plot:"The aging patriarch of an organized crime dynasty transfers control to his reluctant son.",mood:["Intense","Dramatic","Epic"],era:"70s",style:"Epic Crime",votes:1900000,tmdb_id:238},
  {id:3,title:"The Dark Knight",year:2008,genres:["Action","Crime","Drama"],director:"Christopher Nolan",cast:["Christian Bale","Heath Ledger"],rating:9.0,runtime:152,language:"English",country:"USA",plot:"Batman faces the Joker, a criminal mastermind who seeks to plunge Gotham into anarchy.",mood:["Intense","Dark","Thrilling"],era:"2000s",style:"Blockbuster",votes:2700000,tmdb_id:155},
  {id:4,title:"Schindler's List",year:1993,genres:["Biography","Drama","History"],director:"Steven Spielberg",cast:["Liam Neeson","Ralph Fiennes"],rating:9.0,runtime:195,language:"English",country:"USA",plot:"In German-occupied Poland, Oskar Schindler becomes concerned for his Jewish workforce after witnessing the horrors of the Holocaust.",mood:["Emotional","Heavy","Powerful"],era:"90s",style:"Historical Epic",votes:1400000,tmdb_id:424},
  {id:5,title:"Pulp Fiction",year:1994,genres:["Crime","Drama"],director:"Quentin Tarantino",cast:["John Travolta","Uma Thurman","Samuel L. Jackson"],rating:8.9,runtime:154,language:"English",country:"USA",plot:"The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",mood:["Cool","Intense","Quirky"],era:"90s",style:"Non-linear Crime",votes:2100000,tmdb_id:680},
  {id:6,title:"Fight Club",year:1999,genres:["Drama"],director:"David Fincher",cast:["Brad Pitt","Edward Norton"],rating:8.8,runtime:139,language:"English",country:"USA",plot:"An insomniac office worker forms an underground fight club with a soap salesman.",mood:["Dark","Intense","Mind-bending"],era:"90s",style:"Psychological",votes:2100000,tmdb_id:550},
  {id:7,title:"Inception",year:2010,genres:["Action","Adventure","Sci-Fi"],director:"Christopher Nolan",cast:["Leonardo DiCaprio","Joseph Gordon-Levitt"],rating:8.8,runtime:148,language:"English",country:"USA",plot:"A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.",mood:["Mind-bending","Thrilling","Intense"],era:"2010s",style:"Sci-Fi Thriller",votes:2400000,tmdb_id:27205},
  {id:8,title:"The Matrix",year:1999,genres:["Action","Sci-Fi"],director:"The Wachowskis",cast:["Keanu Reeves","Laurence Fishburne"],rating:8.7,runtime:136,language:"English",country:"USA",plot:"A computer hacker learns about the true nature of reality and his role in the war against its controllers.",mood:["Mind-bending","Action","Cool"],era:"90s",style:"Sci-Fi Action",votes:1900000,tmdb_id:603},
  {id:9,title:"Goodfellas",year:1990,genres:["Biography","Crime","Drama"],director:"Martin Scorsese",cast:["Ray Liotta","Robert De Niro","Joe Pesci"],rating:8.7,runtime:146,language:"English",country:"USA",plot:"The story of Henry Hill and his life in the mob.",mood:["Cool","Intense","Epic"],era:"90s",style:"Crime Biopic",votes:1100000,tmdb_id:769},
  {id:10,title:"Forrest Gump",year:1994,genres:["Drama","Romance"],director:"Robert Zemeckis",cast:["Tom Hanks","Robin Wright"],rating:8.8,runtime:142,language:"English",country:"USA",plot:"American history unfolds through the perspective of a simple Alabama man with an extraordinary life.",mood:["Heartwarming","Nostalgic","Emotional"],era:"90s",style:"Drama",votes:2100000,tmdb_id:13},
  {id:11,title:"Interstellar",year:2014,genres:["Adventure","Drama","Sci-Fi"],director:"Christopher Nolan",cast:["Matthew McConaughey","Anne Hathaway"],rating:8.7,runtime:169,language:"English",country:"USA",plot:"A team of explorers travel through a wormhole in space to ensure humanity's survival.",mood:["Emotional","Epic","Mind-bending"],era:"2010s",style:"Sci-Fi Epic",votes:1900000,tmdb_id:157336},
  {id:12,title:"The Silence of the Lambs",year:1991,genres:["Crime","Drama","Thriller"],director:"Jonathan Demme",cast:["Jodie Foster","Anthony Hopkins"],rating:8.6,runtime:118,language:"English",country:"USA",plot:"A young FBI cadet seeks help from an incarcerated cannibal to catch another serial killer.",mood:["Thrilling","Dark","Intense"],era:"90s",style:"Psychological Thriller",votes:1500000,tmdb_id:274},
  {id:13,title:"Parasite",year:2019,genres:["Comedy","Drama","Thriller"],director:"Bong Joon-ho",cast:["Song Kang-ho","Lee Sun-kyun"],rating:8.5,runtime:132,language:"Korean",country:"South Korea",plot:"Greed and class discrimination threaten the newly formed relationship between two families.",mood:["Thrilling","Dark","Quirky"],era:"2010s",style:"Social Satire",votes:870000,tmdb_id:496243},
  {id:14,title:"Spirited Away",year:2001,genres:["Animation","Adventure","Family"],director:"Hayao Miyazaki",cast:["Daveigh Chase","Suzanne Pleshette"],rating:8.6,runtime:125,language:"Japanese",country:"Japan",plot:"A sullen girl wanders into a world ruled by gods, witches, and spirits.",mood:["Magical","Heartwarming","Whimsical"],era:"2000s",style:"Animated Fantasy",votes:740000,tmdb_id:129},
  {id:15,title:"Whiplash",year:2014,genres:["Drama","Music"],director:"Damien Chazelle",cast:["Miles Teller","J.K. Simmons"],rating:8.5,runtime:107,language:"English",country:"USA",plot:"A young drummer's ambitions are shaped by an abusive instructor at an elite music conservatory.",mood:["Intense","Inspiring","Dramatic"],era:"2010s",style:"Character Study",votes:790000,tmdb_id:244786},
  {id:16,title:"La La Land",year:2016,genres:["Comedy","Drama","Music"],director:"Damien Chazelle",cast:["Ryan Gosling","Emma Stone"],rating:8.0,runtime:128,language:"English",country:"USA",plot:"A pianist and an actress fall in love while attempting to reconcile careers and aspirations in Los Angeles.",mood:["Romantic","Nostalgic","Bittersweet"],era:"2010s",style:"Musical Romance",votes:630000,tmdb_id:313369},
  {id:17,title:"No Country for Old Men",year:2007,genres:["Crime","Drama","Thriller"],director:"Coen Brothers",cast:["Tommy Lee Jones","Javier Bardem","Josh Brolin"],rating:8.2,runtime:122,language:"English",country:"USA",plot:"Violence erupts after a hunter stumbles upon a drug deal gone wrong and two million dollars in cash.",mood:["Dark","Tense","Intense"],era:"2000s",style:"Neo-Western",votes:960000,tmdb_id:6977},
  {id:18,title:"Mad Max: Fury Road",year:2015,genres:["Action","Adventure","Sci-Fi"],director:"George Miller",cast:["Tom Hardy","Charlize Theron"],rating:8.1,runtime:120,language:"English",country:"Australia",plot:"In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland.",mood:["Action","Intense","Epic"],era:"2010s",style:"Action Spectacle",votes:970000,tmdb_id:76341},
  {id:19,title:"Her",year:2013,genres:["Drama","Romance","Sci-Fi"],director:"Spike Jonze",cast:["Joaquin Phoenix","Scarlett Johansson"],rating:8.0,runtime:126,language:"English",country:"USA",plot:"A lonely writer develops an unlikely relationship with an AI operating system.",mood:["Romantic","Emotional","Thought-provoking"],era:"2010s",style:"Sci-Fi Romance",votes:590000,tmdb_id:152601},
  {id:20,title:"The Grand Budapest Hotel",year:2014,genres:["Adventure","Comedy","Crime"],director:"Wes Anderson",cast:["Ralph Fiennes","Tony Revolori"],rating:8.1,runtime:99,language:"English",country:"Germany",plot:"The adventures of a legendary concierge at a famous European hotel between the wars.",mood:["Quirky","Fun","Whimsical"],era:"2010s",style:"Wes Anderson",votes:710000,tmdb_id:194662},
  {id:21,title:"Moonlight",year:2016,genres:["Drama"],director:"Barry Jenkins",cast:["Trevante Rhodes","André Holland"],rating:7.4,runtime:111,language:"English",country:"USA",plot:"A young man grapples with his identity across three chapters of his life.",mood:["Emotional","Poetic","Quiet"],era:"2010s",style:"Art House",votes:200000,tmdb_id:376867},
  {id:22,title:"Get Out",year:2017,genres:["Horror","Mystery","Thriller"],director:"Jordan Peele",cast:["Daniel Kaluuya","Allison Williams"],rating:7.7,runtime:104,language:"English",country:"USA",plot:"A young African-American visits his girlfriend's parents and discovers sinister secrets.",mood:["Thrilling","Dark","Unsettling"],era:"2010s",style:"Social Horror",votes:590000,tmdb_id:419430},
  {id:23,title:"Princess Mononoke",year:1997,genres:["Animation","Action","Adventure"],director:"Hayao Miyazaki",cast:["Billy Crudup","Claire Danes"],rating:8.3,runtime:134,language:"Japanese",country:"Japan",plot:"A young warrior finds himself in a war between forest gods and an iron-smelting town.",mood:["Epic","Emotional","Magical"],era:"90s",style:"Animated Fantasy",votes:380000,tmdb_id:128},
  {id:24,title:"Eternal Sunshine of the Spotless Mind",year:2004,genres:["Drama","Romance","Sci-Fi"],director:"Michel Gondry",cast:["Jim Carrey","Kate Winslet"],rating:8.3,runtime:108,language:"English",country:"USA",plot:"A couple undergoes a procedure to erase memories of each other after their relationship turns sour.",mood:["Romantic","Melancholic","Unique"],era:"2000s",style:"Sci-Fi Romance",votes:940000,tmdb_id:38},
  {id:25,title:"Taxi Driver",year:1976,genres:["Crime","Drama"],director:"Martin Scorsese",cast:["Robert De Niro","Jodie Foster"],rating:8.2,runtime:114,language:"English",country:"USA",plot:"A mentally unstable veteran works as a nighttime taxi driver in decadent New York City.",mood:["Dark","Gritty","Intense"],era:"70s",style:"Neo-noir",votes:820000,tmdb_id:922},
  {id:26,title:"Blade Runner 2049",year:2017,genres:["Action","Drama","Mystery"],director:"Denis Villeneuve",cast:["Ryan Gosling","Harrison Ford"],rating:8.0,runtime:163,language:"English",country:"USA",plot:"A young blade runner discovers a long-buried secret.",mood:["Atmospheric","Epic","Thought-provoking"],era:"2010s",style:"Sci-Fi Noir",votes:470000,tmdb_id:335984},
  {id:27,title:"Oldboy",year:2003,genres:["Action","Drama","Mystery"],director:"Park Chan-wook",cast:["Choi Min-sik","Yoo Ji-tae"],rating:8.4,runtime:120,language:"Korean",country:"South Korea",plot:"After 15 years of inexplicable imprisonment, a man must find his captor in five days.",mood:["Dark","Mind-bending","Intense"],era:"2000s",style:"Korean Thriller",votes:550000,tmdb_id:670},
  {id:28,title:"The Truman Show",year:1998,genres:["Comedy","Drama"],director:"Peter Weir",cast:["Jim Carrey","Ed Harris"],rating:8.2,runtime:103,language:"English",country:"USA",plot:"An insurance salesman discovers his whole life is actually a reality TV show.",mood:["Thought-provoking","Emotional","Unique"],era:"90s",style:"Satire",votes:1000000,tmdb_id:37165},
  {id:29,title:"Amélie",year:2001,genres:["Comedy","Romance"],director:"Jean-Pierre Jeunet",cast:["Audrey Tautou","Mathieu Kassovitz"],rating:8.3,runtime:122,language:"French",country:"France",plot:"A shy Parisian waitress decides to change the lives of those around her.",mood:["Whimsical","Romantic","Heartwarming"],era:"2000s",style:"French Cinema",votes:740000,tmdb_id:194},
  {id:30,title:"2001: A Space Odyssey",year:1968,genres:["Adventure","Sci-Fi"],director:"Stanley Kubrick",cast:["Keir Dullea","Gary Lockwood"],rating:8.3,runtime:149,language:"English",country:"UK",plot:"A spacecraft is sent to Jupiter to find the origins of a mysterious artifact.",mood:["Mind-bending","Atmospheric","Epic"],era:"Classic",style:"Kubrick",votes:680000,tmdb_id:62},
  {id:31,title:"The Prestige",year:2006,genres:["Drama","Mystery","Sci-Fi"],director:"Christopher Nolan",cast:["Christian Bale","Hugh Jackman"],rating:8.5,runtime:130,language:"English",country:"USA",plot:"Two stage magicians engage in a dangerous battle to create the ultimate illusion.",mood:["Mind-bending","Intense","Mysterious"],era:"2000s",style:"Mystery Thriller",votes:1300000,tmdb_id:1124},
  {id:32,title:"City of God",year:2002,genres:["Crime","Drama"],director:"Fernando Meirelles",cast:["Alexandre Rodrigues","Leandro Firmino"],rating:8.6,runtime:130,language:"Portuguese",country:"Brazil",plot:"In the slums of Rio, two kids take different paths: one a photographer, the other a drug dealer.",mood:["Intense","Gritty","Powerful"],era:"2000s",style:"World Cinema",votes:780000,tmdb_id:598},
  {id:33,title:"Django Unchained",year:2012,genres:["Drama","Western"],director:"Quentin Tarantino",cast:["Jamie Foxx","Christoph Waltz"],rating:8.4,runtime:165,language:"English",country:"USA",plot:"A freed slave and a bounty hunter team up to rescue his wife from a plantation owner.",mood:["Action","Cool","Intense"],era:"2010s",style:"Tarantino Western",votes:1500000,tmdb_id:68718},
  {id:34,title:"Gone Girl",year:2014,genres:["Drama","Mystery","Thriller"],director:"David Fincher",cast:["Ben Affleck","Rosamund Pike"],rating:8.1,runtime:149,language:"English",country:"USA",plot:"A man becomes the prime suspect when his wife mysteriously disappears.",mood:["Thrilling","Dark","Tense"],era:"2010s",style:"Psychological Thriller",votes:930000,tmdb_id:210577},
  {id:35,title:"Memento",year:2000,genres:["Mystery","Thriller"],director:"Christopher Nolan",cast:["Guy Pearce","Carrie-Anne Moss"],rating:8.4,runtime:113,language:"English",country:"USA",plot:"A man with short-term memory loss attempts to track down his wife's murderer.",mood:["Mind-bending","Thrilling","Mysterious"],era:"2000s",style:"Neo-noir",votes:1200000,tmdb_id:77},
  {id:36,title:"Pan's Labyrinth",year:2006,genres:["Drama","Fantasy","War"],director:"Guillermo del Toro",cast:["Ivana Baquero","Sergi López"],rating:8.2,runtime:118,language:"Spanish",country:"Spain",plot:"In 1944 Falangist Spain, a girl escapes into a dark but captivating fantasy world.",mood:["Dark","Magical","Emotional"],era:"2000s",style:"Dark Fantasy",votes:680000,tmdb_id:1950},
  {id:37,title:"Everything Everywhere All at Once",year:2022,genres:["Action","Adventure","Comedy"],director:"Daniels",cast:["Michelle Yeoh","Ke Huy Quan"],rating:7.8,runtime:139,language:"English",country:"USA",plot:"A middle-aged Chinese immigrant must save the world by exploring other universes.",mood:["Quirky","Emotional","Mind-bending"],era:"2020s",style:"Multiverse Comedy",votes:670000,tmdb_id:545611},
  {id:38,title:"Oppenheimer",year:2023,genres:["Biography","Drama","History"],director:"Christopher Nolan",cast:["Cillian Murphy","Emily Blunt"],rating:8.4,runtime:180,language:"English",country:"USA",plot:"The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.",mood:["Epic","Heavy","Intense"],era:"2020s",style:"Historical Epic",votes:580000,tmdb_id:872585},
  {id:39,title:"Dune",year:2021,genres:["Action","Adventure","Drama"],director:"Denis Villeneuve",cast:["Timothée Chalamet","Rebecca Ferguson"],rating:8.0,runtime:155,language:"English",country:"USA",plot:"The son of a noble family is entrusted with the protection of the most valuable asset in the galaxy.",mood:["Epic","Atmospheric","Dramatic"],era:"2020s",style:"Sci-Fi Epic",votes:700000,tmdb_id:438631},
  {id:40,title:"About Time",year:2013,genres:["Comedy","Drama","Romance"],director:"Richard Curtis",cast:["Domhnall Gleeson","Rachel McAdams"],rating:7.8,runtime:123,language:"English",country:"UK",plot:"A young man who can time-travel learns to appreciate the present moment.",mood:["Heartwarming","Romantic","Feel-Good"],era:"2010s",style:"Romantic Comedy",votes:390000,tmdb_id:135397},
  {id:41,title:"Knives Out",year:2019,genres:["Comedy","Crime","Drama"],director:"Rian Johnson",cast:["Daniel Craig","Ana de Armas"],rating:7.9,runtime:130,language:"English",country:"USA",plot:"A detective investigates the death of a patriarch of an eccentric, combative family.",mood:["Fun","Quirky","Thrilling"],era:"2010s",style:"Whodunit",votes:600000,tmdb_id:546554},
  {id:42,title:"Soul",year:2020,genres:["Animation","Adventure","Comedy"],director:"Pete Docter",cast:["Jamie Foxx","Tina Fey"],rating:8.1,runtime:100,language:"English",country:"USA",plot:"A jazz pianist finds himself trapped between Earth and the afterlife.",mood:["Heartwarming","Emotional","Inspiring"],era:"2020s",style:"Animated Drama",votes:430000,tmdb_id:508442},
  {id:43,title:"Coco",year:2017,genres:["Animation","Adventure","Family"],director:"Lee Unkrich",cast:["Anthony Gonzalez","Gael García Bernal"],rating:8.4,runtime:105,language:"English",country:"USA",plot:"An aspiring musician enters the Land of the Dead to find his great-great-grandfather.",mood:["Heartwarming","Emotional","Magical"],era:"2010s",style:"Animated Drama",votes:520000,tmdb_id:354912},
  {id:44,title:"The Wolf of Wall Street",year:2013,genres:["Biography","Comedy","Crime"],director:"Martin Scorsese",cast:["Leonardo DiCaprio","Jonah Hill"],rating:8.2,runtime:180,language:"English",country:"USA",plot:"The rise and fall of stock broker Jordan Belfort.",mood:["Fun","Intense","Excessive"],era:"2010s",style:"Crime Biopic",votes:1400000,tmdb_id:106646},
  {id:45,title:"Catch Me If You Can",year:2002,genres:["Biography","Crime","Drama"],director:"Steven Spielberg",cast:["Leonardo DiCaprio","Tom Hanks"],rating:8.1,runtime:141,language:"English",country:"USA",plot:"A young con artist assumes multiple identities while pursued by the FBI.",mood:["Fun","Thrilling","Charming"],era:"2000s",style:"Crime Caper",votes:1000000,tmdb_id:5765},
  {id:46,title:"Black Swan",year:2010,genres:["Drama","Horror","Thriller"],director:"Darren Aronofsky",cast:["Natalie Portman","Mila Kunis"],rating:8.0,runtime:108,language:"English",country:"USA",plot:"A committed dancer wins the lead role in Swan Lake but struggles to maintain her sanity.",mood:["Dark","Intense","Disturbing"],era:"2010s",style:"Psychological Horror",votes:790000,tmdb_id:37799},
  {id:47,title:"Portrait of a Lady on Fire",year:2019,genres:["Drama","Romance"],director:"Céline Sciamma",cast:["Noémie Merlant","Adèle Haenel"],rating:8.1,runtime:122,language:"French",country:"France",plot:"On an isolated 18th century island, a painter and her subject fall in love.",mood:["Romantic","Poetic","Emotional"],era:"2010s",style:"Art House",votes:130000,tmdb_id:614934},
  {id:48,title:"The Banshees of Inisherin",year:2022,genres:["Comedy","Drama"],director:"Martin McDonagh",cast:["Colin Farrell","Brendan Gleeson"],rating:7.7,runtime:114,language:"English",country:"Ireland",plot:"Two lifelong friends find themselves at an impasse when one abruptly ends their friendship.",mood:["Melancholic","Dark","Quiet"],era:"2020s",style:"Art House",votes:190000,tmdb_id:674324},
  {id:49,title:"The Pianist",year:2002,genres:["Biography","Drama","Music"],director:"Roman Polanski",cast:["Adrien Brody","Thomas Kretschmann"],rating:8.5,runtime:150,language:"English",country:"Poland",plot:"A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto.",mood:["Emotional","Heavy","Powerful"],era:"2000s",style:"Historical Drama",votes:730000,tmdb_id:423},
  {id:50,title:"Oldboy",year:2003,genres:["Action","Drama","Mystery"],director:"Park Chan-wook",cast:["Choi Min-sik","Yoo Ji-tae"],rating:8.4,runtime:120,language:"Korean",country:"South Korea",plot:"A man imprisoned for 15 years must find his captor in five days.",mood:["Dark","Mind-bending","Intense"],era:"2000s",style:"Korean Thriller",votes:550000,tmdb_id:670},
];

// De-dup and add poster_url
const MOVIES_LIST = [];
const SEEN_IDS = new Set();
DEMO_DATA.forEach(m => {
  if (!SEEN_IDS.has(m.id)) {
    SEEN_IDS.add(m.id);
    MOVIES_LIST.push({ ...m, poster_url: posterUrl(m.tmdb_id) });
  }
});
const MOVIES_MAP = Object.fromEntries(MOVIES_LIST.map(m => [m.id, m]));

// ── LOCAL STATE (demo mode) ──
// ── PERSISTENT LOCAL STATE (survives page refresh) ──
function loadLocal() {
  try {
    const wl = JSON.parse(localStorage.getItem('cm_watchlist') || '[]');
    const rt = JSON.parse(localStorage.getItem('cm_ratings') || '{}');
    const hs = JSON.parse(localStorage.getItem('cm_history') || '[]');
    return { watchlist: new Set(wl), ratings: rt, history: hs };
  } catch { return { watchlist: new Set(), ratings: {}, history: [] }; }
}
function saveLocal() {
  try {
    localStorage.setItem('cm_watchlist', JSON.stringify([...LOCAL.watchlist]));
    localStorage.setItem('cm_ratings', JSON.stringify(LOCAL.ratings));
    localStorage.setItem('cm_history', JSON.stringify(LOCAL.history));
  } catch {}
}
const LOCAL = loadLocal();

function fmtLocal(m) {
  return { ...m, in_watchlist: LOCAL.watchlist.has(m.id), user_rating: LOCAL.ratings[m.id] || null };
}

function similarLocal(id, n=8) {
  const m = MOVIES_MAP[id];
  if (!m) return [];
  return MOVIES_LIST
    .filter(x => x.id !== id)
    .map(x => {
      let s = 0;
      if (x.director === m.director) s += 3;
      x.genres.forEach(g => m.genres.includes(g) && (s += 2));
      x.mood.forEach(mo => m.mood.includes(mo) && (s += 1.5));
      if (x.era === m.era) s += 1;
      if (x.style === m.style) s += 2;
      return { x, s };
    })
    .sort((a,b) => b.s - a.s || b.x.rating - a.x.rating)
    .slice(0, n)
    .map(({ x }) => fmtLocal(x));
}

// ── BACKEND STATUS ──
let backendOnline = false;

async function checkBackend() {
  try {
    const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    backendOnline = r.ok;
  } catch { backendOnline = false; }
  return backendOnline;
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: { ...(opts.headers || {}), ...AUTH.headers() },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ── UNIFIED DATA LAYER ──
const DATA = {
  async getMovies({ genre, era, mood, sort='rating', limit=50 } = {}) {
    if (backendOnline) return apiFetch(`/movies?genre=${genre||''}&era=${era||''}&mood=${mood||''}&sort=${sort}&limit=${limit}`);
    let list = [...MOVIES_LIST];
    if (genre) list = list.filter(m => m.genres.some(g => g.toLowerCase().includes(genre.toLowerCase())));
    if (era)   list = list.filter(m => m.era === era);
    if (mood)  list = list.filter(m => m.mood.some(mo => mo.toLowerCase().includes(mood.toLowerCase())));
    list.sort((a,b) => sort==='year' ? b.year-a.year : sort==='votes' ? b.votes-a.votes : b.rating-a.rating);
    return { movies: list.slice(0, limit).map(fmtLocal) };
  },

  async getMovie(id) {
    if (backendOnline) return apiFetch(`/movies/${id}`);
    const m = MOVIES_MAP[id];
    if (!m) return null;
    if (!LOCAL.history.includes(id)) { LOCAL.history.push(id); if (LOCAL.history.length > 30) LOCAL.history.shift(); saveLocal(); }
    return { ...fmtLocal(m), similar: similarLocal(id, 6) };
  },

  async search(q) {
    if (backendOnline) return apiFetch(`/search?q=${encodeURIComponent(q)}`);
    const ql = q.toLowerCase();
    const movies = MOVIES_LIST.filter(m =>
      m.title.toLowerCase().includes(ql) ||
      m.director.toLowerCase().includes(ql) ||
      m.cast.some(c => c.toLowerCase().includes(ql)) ||
      m.genres.some(g => g.toLowerCase().includes(ql)) ||
      m.mood.some(mo => mo.toLowerCase().includes(ql)) ||
      m.plot.toLowerCase().includes(ql)
    ).map(fmtLocal);
    return { movies };
  },

  async getFilters() {
    if (backendOnline) return apiFetch('/filters');
    return {
      genres: [...new Set(MOVIES_LIST.flatMap(m => m.genres))].sort(),
      eras:   [...new Set(MOVIES_LIST.map(m => m.era))].sort(),
      moods:  [...new Set(MOVIES_LIST.flatMap(m => m.mood))].sort(),
    };
  },

  async getStats() {
    if (backendOnline) return apiFetch('/stats');
    return { total_movies: MOVIES_LIST.length, user_rated: Object.keys(LOCAL.ratings).length, watchlist_count: LOCAL.watchlist.size, history_count: LOCAL.history.length };
  },

  async recommendSimilar(id) {
    if (backendOnline) return apiFetch(`/recommend/similar/${id}`);
    return { recommendations: similarLocal(id, 8) };
  },

  async recommendMood({ mood, era }={}) {
    if (backendOnline) return apiFetch(`/recommend/mood?mood=${mood||''}&era=${era||''}`);
    let list = [...MOVIES_LIST];
    if (mood) list = list.filter(m => m.mood.some(mo => mo.toLowerCase().includes(mood.toLowerCase())));
    if (era)  list = list.filter(m => m.era === era);
    return { recommendations: list.sort((a,b)=>b.rating-a.rating).slice(0,12).map(fmtLocal) };
  },

  async getDirectors() {
    if (backendOnline) return apiFetch('/recommend/director');
    const map = {};
    MOVIES_LIST.forEach(m => {
      if (!map[m.director]) map[m.director] = { director: m.director, count:0, total:0 };
      map[m.director].count++;
      map[m.director].total += m.rating;
    });
    const dirs = Object.values(map).map(d => ({ director: d.director, count: d.count, avg_rating: +(d.total/d.count).toFixed(2) })).filter(d => d.count >= 2).sort((a,b) => b.avg_rating - a.avg_rating);
    return { directors: dirs };
  },

  async recommendDirector(director) {
    if (backendOnline) return apiFetch(`/recommend/director?director=${encodeURIComponent(director)}`);
    const dl = director.toLowerCase();
    const movies = MOVIES_LIST.filter(m => m.director.toLowerCase().includes(dl)).sort((a,b) => b.rating-a.rating);
    const style = movies[0]?.style;
    const similar_style = style ? MOVIES_LIST.filter(m => m.style===style && !m.director.toLowerCase().includes(dl)).sort((a,b)=>b.rating-a.rating).slice(0,4).map(fmtLocal) : [];
    return { movies: movies.map(fmtLocal), director, similar_style };
  },

  async recommendHybrid() {
    if (backendOnline) return apiFetch('/recommend/hybrid');
    const seen = new Set([...LOCAL.history, ...Object.keys(LOCAL.ratings).map(Number)]);
    const liked = Object.entries(LOCAL.ratings).filter(([,r])=>r>=4).map(([id])=>+id);
    if (!liked.length) return { recommendations: MOVIES_LIST.filter(m=>!seen.has(m.id)).sort((a,b)=>b.rating-a.rating).slice(0,10).map(fmtLocal) };
    return { recommendations: MOVIES_LIST.filter(m=>!seen.has(m.id)).sort((a,b)=>b.rating-a.rating).slice(0,10).map(fmtLocal) };
  },

  async getWatchlist() {
    if (backendOnline) {
      try {
        const result = await apiFetch('/watchlist');
        // Sync local state from backend
        LOCAL.watchlist = new Set((result.watchlist || []).map(m => m.id));
        saveLocal();
        return result;
      } catch {}
    }
    return { watchlist: [...LOCAL.watchlist].map(id=>MOVIES_MAP[id]).filter(Boolean).map(fmtLocal) };
  },

  async addWatchlist(id) {
    LOCAL.watchlist.add(id);
    saveLocal();
    if (backendOnline) {
      try { return await apiFetch('/watchlist', { method:'POST', body: JSON.stringify({movie_id:id}) }); } catch {}
    }
    return { success:true };
  },

  async removeWatchlist(id) {
    LOCAL.watchlist.delete(id);
    saveLocal();
    if (backendOnline) {
      try { return await apiFetch('/watchlist', { method:'DELETE', body: JSON.stringify({movie_id:id}) }); } catch {}
    }
    return { success:true };
  },

  async rateMovie(id, rating) {
    LOCAL.ratings[id] = rating;
    saveLocal();
    if (backendOnline) {
      try { return await apiFetch('/rate', { method:'POST', body: JSON.stringify({movie_id:id, rating}) }); } catch {}
    }
    return { success:true };
  },
};

async function initData() {
  await checkBackend();
  console.log(`CineMatch: backend ${backendOnline ? '✅ online' : '⚠️ demo mode (data saved locally)'}`);
  if (backendOnline) {
    // Sync ratings from backend into LOCAL so UI reflects saved state
    try {
      const me = await apiFetch('/auth/me');
      if (me && me.ratings) {
        LOCAL.ratings = me.ratings;
        saveLocal();
      }
      if (me && me.watchlist) {
        LOCAL.watchlist = new Set(me.watchlist);
        saveLocal();
      }
    } catch {}
  }
}
