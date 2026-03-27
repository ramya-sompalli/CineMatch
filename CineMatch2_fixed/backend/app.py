"""
CineMatch — Movie Recommendation Engine
Backend: Python Flask + Pandas + Scikit-learn + JWT Auth + TMDB Images
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json, os, hashlib, uuid, requests, sqlite3
from datetime import datetime, timedelta
import functools

app = Flask(__name__)
app.secret_key = 'cinematch_secret_2024_change_in_production'
CORS(app, supports_credentials=True, origins=["*"])

# ── TMDB CONFIG ──
TMDB_KEY = os.environ.get('TMDB_API_KEY', '')  # Set your TMDB key here or via env
TMDB_BASE = 'https://api.themoviedb.org/3'
TMDB_IMG  = 'https://image.tmdb.org/t/p/w500'

# ── DATABASE SETUP (SQLite) ──
DB_PATH = os.path.join(os.path.dirname(__file__), 'cinematch.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                username      TEXT PRIMARY KEY,
                email         TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at    TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token    TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                FOREIGN KEY (username) REFERENCES users(username)
            );
            CREATE TABLE IF NOT EXISTS watchlist (
                username TEXT NOT NULL,
                movie_id INTEGER NOT NULL,
                PRIMARY KEY (username, movie_id),
                FOREIGN KEY (username) REFERENCES users(username)
            );
            CREATE TABLE IF NOT EXISTS ratings (
                username TEXT NOT NULL,
                movie_id INTEGER NOT NULL,
                rating   REAL NOT NULL,
                PRIMARY KEY (username, movie_id),
                FOREIGN KEY (username) REFERENCES users(username)
            );
        """)
        conn.commit()
    print(f"   Database: {DB_PATH}")

init_db()

def db_get_user(username):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        if not row:
            return None
        watchlist = [r[0] for r in conn.execute("SELECT movie_id FROM watchlist WHERE username=?", (username,))]
        ratings   = {r[0]: r[1] for r in conn.execute("SELECT movie_id, rating FROM ratings WHERE username=?", (username,))}
        return {'username': row['username'], 'email': row['email'],
                'password_hash': row['password_hash'], 'created_at': row['created_at'],
                'watchlist': watchlist, 'ratings': ratings, 'history': []}

def db_user_exists(username):
    with get_db() as conn:
        return conn.execute("SELECT 1 FROM users WHERE username=?", (username,)).fetchone() is not None

def db_create_user(username, email, password_hash):
    with get_db() as conn:
        conn.execute("INSERT INTO users (username, email, password_hash, created_at) VALUES (?,?,?,?)",
                     (username, email, password_hash, datetime.utcnow().isoformat()))
        conn.commit()

def db_get_session(token):
    with get_db() as conn:
        row = conn.execute("SELECT username FROM sessions WHERE token=?", (token,)).fetchone()
        return row['username'] if row else None

def db_create_session(token, username):
    with get_db() as conn:
        conn.execute("INSERT INTO sessions (token, username) VALUES (?,?)", (token, username))
        conn.commit()

def db_delete_session(token):
    with get_db() as conn:
        conn.execute("DELETE FROM sessions WHERE token=?", (token,))
        conn.commit()

def db_watchlist_add(username, movie_id):
    with get_db() as conn:
        conn.execute("INSERT OR IGNORE INTO watchlist (username, movie_id) VALUES (?,?)", (username, movie_id))
        conn.commit()

def db_watchlist_remove(username, movie_id):
    with get_db() as conn:
        conn.execute("DELETE FROM watchlist WHERE username=? AND movie_id=?", (username, movie_id))
        conn.commit()

def db_rate(username, movie_id, rating):
    with get_db() as conn:
        conn.execute("INSERT OR REPLACE INTO ratings (username, movie_id, rating) VALUES (?,?,?)",
                     (username, movie_id, rating))
        conn.commit()

def db_user_count():
    with get_db() as conn:
        return conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]

# ── MOVIE DATA ──
MOVIES = [
    {"id":1,"title":"The Shawshank Redemption","year":1994,"genres":["Drama"],"director":"Frank Darabont","cast":["Tim Robbins","Morgan Freeman"],"rating":9.3,"votes":2700000,"runtime":142,"language":"English","country":"USA","plot":"Two imprisoned men bond over years finding solace and eventual redemption through acts of common decency.","mood":["Inspiring","Emotional","Hopeful"],"era":"90s","style":"Character Study","tmdb_id":278},
    {"id":2,"title":"The Godfather","year":1972,"genres":["Crime","Drama"],"director":"Francis Ford Coppola","cast":["Marlon Brando","Al Pacino"],"rating":9.2,"votes":1900000,"runtime":175,"language":"English","country":"USA","plot":"The aging patriarch of an organized crime dynasty transfers control to his reluctant son.","mood":["Intense","Dramatic","Epic"],"era":"70s","style":"Epic Crime","tmdb_id":238},
    {"id":3,"title":"The Dark Knight","year":2008,"genres":["Action","Crime","Drama"],"director":"Christopher Nolan","cast":["Christian Bale","Heath Ledger"],"rating":9.0,"votes":2700000,"runtime":152,"language":"English","country":"USA","plot":"Batman faces the Joker, a criminal mastermind who seeks to plunge Gotham into anarchy.","mood":["Intense","Dark","Thrilling"],"era":"2000s","style":"Blockbuster","tmdb_id":155},
    {"id":4,"title":"Schindler's List","year":1993,"genres":["Biography","Drama","History"],"director":"Steven Spielberg","cast":["Liam Neeson","Ralph Fiennes"],"rating":9.0,"votes":1400000,"runtime":195,"language":"English","country":"USA","plot":"In German-occupied Poland, Oskar Schindler becomes concerned for his Jewish workforce after witnessing the horrors of the Holocaust.","mood":["Emotional","Heavy","Powerful"],"era":"90s","style":"Historical Epic","tmdb_id":424},
    {"id":5,"title":"Pulp Fiction","year":1994,"genres":["Crime","Drama"],"director":"Quentin Tarantino","cast":["John Travolta","Uma Thurman","Samuel L. Jackson"],"rating":8.9,"votes":2100000,"runtime":154,"language":"English","country":"USA","plot":"The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.","mood":["Cool","Intense","Quirky"],"era":"90s","style":"Non-linear Crime","tmdb_id":680},
    {"id":6,"title":"Fight Club","year":1999,"genres":["Drama"],"director":"David Fincher","cast":["Brad Pitt","Edward Norton"],"rating":8.8,"votes":2100000,"runtime":139,"language":"English","country":"USA","plot":"An insomniac office worker forms an underground fight club with a soap salesman.","mood":["Dark","Intense","Mind-bending"],"era":"90s","style":"Psychological","tmdb_id":550},
    {"id":7,"title":"Inception","year":2010,"genres":["Action","Adventure","Sci-Fi"],"director":"Christopher Nolan","cast":["Leonardo DiCaprio","Joseph Gordon-Levitt"],"rating":8.8,"votes":2400000,"runtime":148,"language":"English","country":"USA","plot":"A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.","mood":["Mind-bending","Thrilling","Intense"],"era":"2010s","style":"Sci-Fi Thriller","tmdb_id":27205},
    {"id":8,"title":"The Matrix","year":1999,"genres":["Action","Sci-Fi"],"director":"The Wachowskis","cast":["Keanu Reeves","Laurence Fishburne"],"rating":8.7,"votes":1900000,"runtime":136,"language":"English","country":"USA","plot":"A computer hacker learns about the true nature of reality and his role in the war against its controllers.","mood":["Mind-bending","Action","Cool"],"era":"90s","style":"Sci-Fi Action","tmdb_id":603},
    {"id":9,"title":"Goodfellas","year":1990,"genres":["Biography","Crime","Drama"],"director":"Martin Scorsese","cast":["Ray Liotta","Robert De Niro","Joe Pesci"],"rating":8.7,"votes":1100000,"runtime":146,"language":"English","country":"USA","plot":"The story of Henry Hill and his life in the mob.","mood":["Cool","Intense","Epic"],"era":"90s","style":"Crime Biopic","tmdb_id":769},
    {"id":10,"title":"Forrest Gump","year":1994,"genres":["Drama","Romance"],"director":"Robert Zemeckis","cast":["Tom Hanks","Robin Wright"],"rating":8.8,"votes":2100000,"runtime":142,"language":"English","country":"USA","plot":"The presidencies of Kennedy and Johnson unfold through the perspective of a simple Alabama man with an extraordinary life.","mood":["Heartwarming","Nostalgic","Emotional"],"era":"90s","style":"Drama","tmdb_id":13},
    {"id":11,"title":"Interstellar","year":2014,"genres":["Adventure","Drama","Sci-Fi"],"director":"Christopher Nolan","cast":["Matthew McConaughey","Anne Hathaway"],"rating":8.7,"votes":1900000,"runtime":169,"language":"English","country":"USA","plot":"A team of explorers travel through a wormhole in space to ensure humanity's survival.","mood":["Emotional","Epic","Mind-bending"],"era":"2010s","style":"Sci-Fi Epic","tmdb_id":157336},
    {"id":12,"title":"The Silence of the Lambs","year":1991,"genres":["Crime","Drama","Thriller"],"director":"Jonathan Demme","cast":["Jodie Foster","Anthony Hopkins"],"rating":8.6,"votes":1500000,"runtime":118,"language":"English","country":"USA","plot":"A young FBI cadet receives the help of an incarcerated cannibal killer to catch another serial killer.","mood":["Thrilling","Dark","Intense"],"era":"90s","style":"Psychological Thriller","tmdb_id":274},
    {"id":13,"title":"Parasite","year":2019,"genres":["Comedy","Drama","Thriller"],"director":"Bong Joon-ho","cast":["Song Kang-ho","Lee Sun-kyun"],"rating":8.5,"votes":870000,"runtime":132,"language":"Korean","country":"South Korea","plot":"Greed and class discrimination threaten the newly formed symbiotic relationship between two families.","mood":["Thrilling","Dark","Quirky"],"era":"2010s","style":"Social Satire","tmdb_id":496243},
    {"id":14,"title":"Spirited Away","year":2001,"genres":["Animation","Adventure","Family"],"director":"Hayao Miyazaki","cast":["Daveigh Chase","Suzanne Pleshette"],"rating":8.6,"votes":740000,"runtime":125,"language":"Japanese","country":"Japan","plot":"A sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.","mood":["Magical","Heartwarming","Whimsical"],"era":"2000s","style":"Animated Fantasy","tmdb_id":129},
    {"id":15,"title":"Whiplash","year":2014,"genres":["Drama","Music"],"director":"Damien Chazelle","cast":["Miles Teller","J.K. Simmons"],"rating":8.5,"votes":790000,"runtime":107,"language":"English","country":"USA","plot":"A young drummer's dreams are shaped by a brilliantly abusive instructor at an elite music conservatory.","mood":["Intense","Inspiring","Dramatic"],"era":"2010s","style":"Character Study","tmdb_id":244786},
    {"id":16,"title":"La La Land","year":2016,"genres":["Comedy","Drama","Music"],"director":"Damien Chazelle","cast":["Ryan Gosling","Emma Stone"],"rating":8.0,"votes":630000,"runtime":128,"language":"English","country":"USA","plot":"A pianist and an actress fall in love while attempting to reconcile their careers and aspirations in Los Angeles.","mood":["Romantic","Nostalgic","Bittersweet"],"era":"2010s","style":"Musical Romance","tmdb_id":313369},
    {"id":17,"title":"No Country for Old Men","year":2007,"genres":["Crime","Drama","Thriller"],"director":"Coen Brothers","cast":["Tommy Lee Jones","Javier Bardem","Josh Brolin"],"rating":8.2,"votes":960000,"runtime":122,"language":"English","country":"USA","plot":"Violence erupts after a hunter stumbles upon a drug deal gone wrong and two million dollars in cash.","mood":["Dark","Tense","Intense"],"era":"2000s","style":"Neo-Western","tmdb_id":6977},
    {"id":18,"title":"Mad Max: Fury Road","year":2015,"genres":["Action","Adventure","Sci-Fi"],"director":"George Miller","cast":["Tom Hardy","Charlize Theron"],"rating":8.1,"votes":970000,"runtime":120,"language":"English","country":"Australia","plot":"In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland.","mood":["Action","Intense","Epic"],"era":"2010s","style":"Action Spectacle","tmdb_id":76341},
    {"id":19,"title":"Her","year":2013,"genres":["Drama","Romance","Sci-Fi"],"director":"Spike Jonze","cast":["Joaquin Phoenix","Scarlett Johansson"],"rating":8.0,"votes":590000,"runtime":126,"language":"English","country":"USA","plot":"A lonely writer develops an unlikely relationship with an AI operating system.","mood":["Romantic","Emotional","Thought-provoking"],"era":"2010s","style":"Sci-Fi Romance","tmdb_id":152601},
    {"id":20,"title":"The Grand Budapest Hotel","year":2014,"genres":["Adventure","Comedy","Crime"],"director":"Wes Anderson","cast":["Ralph Fiennes","Tony Revolori"],"rating":8.1,"votes":710000,"runtime":99,"language":"English","country":"Germany","plot":"The adventures of a legendary concierge at a famous European hotel between the wars.","mood":["Quirky","Fun","Whimsical"],"era":"2010s","style":"Wes Anderson","tmdb_id":194662},
    {"id":21,"title":"Moonlight","year":2016,"genres":["Drama"],"director":"Barry Jenkins","cast":["Trevante Rhodes","André Holland"],"rating":7.4,"votes":200000,"runtime":111,"language":"English","country":"USA","plot":"A young man grows up in a rough neighborhood and grapples with his identity across three chapters of his life.","mood":["Emotional","Poetic","Quiet"],"era":"2010s","style":"Art House","tmdb_id":376867},
    {"id":22,"title":"Get Out","year":2017,"genres":["Horror","Mystery","Thriller"],"director":"Jordan Peele","cast":["Daniel Kaluuya","Allison Williams"],"rating":7.7,"votes":590000,"runtime":104,"language":"English","country":"USA","plot":"A young African-American visits his white girlfriend's parents and discovers sinister secrets.","mood":["Thrilling","Dark","Unsettling"],"era":"2010s","style":"Social Horror","tmdb_id":419430},
    {"id":23,"title":"Princess Mononoke","year":1997,"genres":["Animation","Action","Adventure"],"director":"Hayao Miyazaki","cast":["Billy Crudup","Claire Danes"],"rating":8.3,"votes":380000,"runtime":134,"language":"Japanese","country":"Japan","plot":"A young warrior finds himself in a war between forest gods and an iron-smelting town.","mood":["Epic","Emotional","Magical"],"era":"90s","style":"Animated Fantasy","tmdb_id":128},
    {"id":24,"title":"Eternal Sunshine of the Spotless Mind","year":2004,"genres":["Drama","Romance","Sci-Fi"],"director":"Michel Gondry","cast":["Jim Carrey","Kate Winslet"],"rating":8.3,"votes":940000,"runtime":108,"language":"English","country":"USA","plot":"A couple undergoes a medical procedure to erase memories of each other after their relationship turns sour.","mood":["Romantic","Melancholic","Unique"],"era":"2000s","style":"Sci-Fi Romance","tmdb_id":38},
    {"id":25,"title":"Taxi Driver","year":1976,"genres":["Crime","Drama"],"director":"Martin Scorsese","cast":["Robert De Niro","Jodie Foster"],"rating":8.2,"votes":820000,"runtime":114,"language":"English","country":"USA","plot":"A mentally unstable veteran works as a nighttime taxi driver in decadent New York City.","mood":["Dark","Gritty","Intense"],"era":"70s","style":"Neo-noir","tmdb_id":922},
    {"id":26,"title":"Blade Runner 2049","year":2017,"genres":["Action","Drama","Mystery"],"director":"Denis Villeneuve","cast":["Ryan Gosling","Harrison Ford"],"rating":8.0,"votes":470000,"runtime":163,"language":"English","country":"USA","plot":"A young blade runner discovers a long-buried secret that leads him to track down Rick Deckard.","mood":["Atmospheric","Epic","Thought-provoking"],"era":"2010s","style":"Sci-Fi Noir","tmdb_id":335984},
    {"id":27,"title":"Oldboy","year":2003,"genres":["Action","Drama","Mystery"],"director":"Park Chan-wook","cast":["Choi Min-sik","Yoo Ji-tae"],"rating":8.4,"votes":550000,"runtime":120,"language":"Korean","country":"South Korea","plot":"After being imprisoned for 15 years, a man is released and must find his captor in five days.","mood":["Dark","Mind-bending","Intense"],"era":"2000s","style":"Korean Thriller","tmdb_id":670},
    {"id":28,"title":"The Truman Show","year":1998,"genres":["Comedy","Drama"],"director":"Peter Weir","cast":["Jim Carrey","Ed Harris"],"rating":8.2,"votes":1000000,"runtime":103,"language":"English","country":"USA","plot":"An insurance salesman discovers his whole life is actually a reality TV show.","mood":["Thought-provoking","Emotional","Unique"],"era":"90s","style":"Satire","tmdb_id":37165},
    {"id":29,"title":"Amélie","year":2001,"genres":["Comedy","Romance"],"director":"Jean-Pierre Jeunet","cast":["Audrey Tautou","Mathieu Kassovitz"],"rating":8.3,"votes":740000,"runtime":122,"language":"French","country":"France","plot":"A shy waitress decides to change the lives of those around her for the better.","mood":["Whimsical","Romantic","Heartwarming"],"era":"2000s","style":"French Cinema","tmdb_id":194},
    {"id":30,"title":"2001: A Space Odyssey","year":1968,"genres":["Adventure","Sci-Fi"],"director":"Stanley Kubrick","cast":["Keir Dullea","Gary Lockwood"],"rating":8.3,"votes":680000,"runtime":149,"language":"English","country":"UK","plot":"A spacecraft is sent to Jupiter to find the origins of a mysterious artifact.","mood":["Mind-bending","Atmospheric","Epic"],"era":"Classic","style":"Kubrick","tmdb_id":62},
    {"id":31,"title":"The Prestige","year":2006,"genres":["Drama","Mystery","Sci-Fi"],"director":"Christopher Nolan","cast":["Christian Bale","Hugh Jackman"],"rating":8.5,"votes":1300000,"runtime":130,"language":"English","country":"USA","plot":"Two stage magicians engage in a dangerous battle to create the ultimate illusion.","mood":["Mind-bending","Intense","Mysterious"],"era":"2000s","style":"Mystery Thriller","tmdb_id":1124},
    {"id":32,"title":"City of God","year":2002,"genres":["Crime","Drama"],"director":"Fernando Meirelles","cast":["Alexandre Rodrigues","Leandro Firmino"],"rating":8.6,"votes":780000,"runtime":130,"language":"Portuguese","country":"Brazil","plot":"In the slums of Rio, two kids take different paths: one becomes a photographer, the other a drug dealer.","mood":["Intense","Gritty","Powerful"],"era":"2000s","style":"World Cinema","tmdb_id":598},
    {"id":33,"title":"Django Unchained","year":2012,"genres":["Drama","Western"],"director":"Quentin Tarantino","cast":["Jamie Foxx","Christoph Waltz"],"rating":8.4,"votes":1500000,"runtime":165,"language":"English","country":"USA","plot":"A freed slave and a bounty hunter team up to rescue his wife from a brutal plantation owner.","mood":["Action","Cool","Intense"],"era":"2010s","style":"Tarantino Western","tmdb_id":68718},
    {"id":34,"title":"Gone Girl","year":2014,"genres":["Drama","Mystery","Thriller"],"director":"David Fincher","cast":["Ben Affleck","Rosamund Pike"],"rating":8.1,"votes":930000,"runtime":149,"language":"English","country":"USA","plot":"A man becomes the prime suspect when his wife mysteriously disappears.","mood":["Thrilling","Dark","Tense"],"era":"2010s","style":"Psychological Thriller","tmdb_id":210577},
    {"id":35,"title":"Memento","year":2000,"genres":["Mystery","Thriller"],"director":"Christopher Nolan","cast":["Guy Pearce","Carrie-Anne Moss"],"rating":8.4,"votes":1200000,"runtime":113,"language":"English","country":"USA","plot":"A man with short-term memory loss attempts to track down his wife's murderer.","mood":["Mind-bending","Thrilling","Mysterious"],"era":"2000s","style":"Neo-noir","tmdb_id":77},
    {"id":36,"title":"Pan's Labyrinth","year":2006,"genres":["Drama","Fantasy","War"],"director":"Guillermo del Toro","cast":["Ivana Baquero","Sergi López"],"rating":8.2,"votes":680000,"runtime":118,"language":"Spanish","country":"Spain","plot":"In 1944 Falangist Spain, a girl escapes into a dark but captivating fantasy world.","mood":["Dark","Magical","Emotional"],"era":"2000s","style":"Dark Fantasy","tmdb_id":1950},
    {"id":37,"title":"Everything Everywhere All at Once","year":2022,"genres":["Action","Adventure","Comedy"],"director":"Daniels","cast":["Michelle Yeoh","Ke Huy Quan"],"rating":7.8,"votes":670000,"runtime":139,"language":"English","country":"USA","plot":"A middle-aged Chinese immigrant must save the world by exploring other universes.","mood":["Quirky","Emotional","Mind-bending"],"era":"2020s","style":"Multiverse Comedy","tmdb_id":545611},
    {"id":38,"title":"Oppenheimer","year":2023,"genres":["Biography","Drama","History"],"director":"Christopher Nolan","cast":["Cillian Murphy","Emily Blunt"],"rating":8.4,"votes":580000,"runtime":180,"language":"English","country":"USA","plot":"The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.","mood":["Epic","Heavy","Intense"],"era":"2020s","style":"Historical Epic","tmdb_id":872585},
    {"id":39,"title":"Dune","year":2021,"genres":["Action","Adventure","Drama"],"director":"Denis Villeneuve","cast":["Timothée Chalamet","Rebecca Ferguson"],"rating":8.0,"votes":700000,"runtime":155,"language":"English","country":"USA","plot":"The son of a noble family is entrusted with the protection of the most valuable asset in the galaxy.","mood":["Epic","Atmospheric","Dramatic"],"era":"2020s","style":"Sci-Fi Epic","tmdb_id":438631},
    {"id":40,"title":"About Time","year":2013,"genres":["Comedy","Drama","Romance"],"director":"Richard Curtis","cast":["Domhnall Gleeson","Rachel McAdams"],"rating":7.8,"votes":390000,"runtime":123,"language":"English","country":"UK","plot":"A young man who can time-travel learns to appreciate the present moment and the people he loves.","mood":["Heartwarming","Romantic","Feel-Good"],"era":"2010s","style":"Romantic Comedy","tmdb_id":135397},
    {"id":41,"title":"Knives Out","year":2019,"genres":["Comedy","Crime","Drama"],"director":"Rian Johnson","cast":["Daniel Craig","Ana de Armas"],"rating":7.9,"votes":600000,"runtime":130,"language":"English","country":"USA","plot":"A detective investigates the death of a patriarch of an eccentric, combative family.","mood":["Fun","Quirky","Thrilling"],"era":"2010s","style":"Whodunit","tmdb_id":546554},
    {"id":42,"title":"Soul","year":2020,"genres":["Animation","Adventure","Comedy"],"director":"Pete Docter","cast":["Jamie Foxx","Tina Fey"],"rating":8.1,"votes":430000,"runtime":100,"language":"English","country":"USA","plot":"A jazz pianist finds himself trapped between Earth and the afterlife after landing the gig of a lifetime.","mood":["Heartwarming","Emotional","Inspiring"],"era":"2020s","style":"Animated Drama","tmdb_id":508442},
    {"id":43,"title":"Coco","year":2017,"genres":["Animation","Adventure","Family"],"director":"Lee Unkrich","cast":["Anthony Gonzalez","Gael García Bernal"],"rating":8.4,"votes":520000,"runtime":105,"language":"English","country":"USA","plot":"An aspiring musician enters the Land of the Dead to find his great-great-grandfather.","mood":["Heartwarming","Emotional","Magical"],"era":"2010s","style":"Animated Drama","tmdb_id":354912},
    {"id":44,"title":"The Wolf of Wall Street","year":2013,"genres":["Biography","Comedy","Crime"],"director":"Martin Scorsese","cast":["Leonardo DiCaprio","Jonah Hill"],"rating":8.2,"votes":1400000,"runtime":180,"language":"English","country":"USA","plot":"The rise and fall of stock broker Jordan Belfort, from wealth and excess to corruption and crime.","mood":["Fun","Intense","Excessive"],"era":"2010s","style":"Crime Biopic","tmdb_id":106646},
    {"id":45,"title":"Catch Me If You Can","year":2002,"genres":["Biography","Crime","Drama"],"director":"Steven Spielberg","cast":["Leonardo DiCaprio","Tom Hanks"],"rating":8.1,"votes":1000000,"runtime":141,"language":"English","country":"USA","plot":"A young con artist assumes multiple identities while pursued by the FBI.","mood":["Fun","Thrilling","Charming"],"era":"2000s","style":"Crime Caper","tmdb_id":5765},
    {"id":46,"title":"Black Swan","year":2010,"genres":["Drama","Horror","Thriller"],"director":"Darren Aronofsky","cast":["Natalie Portman","Mila Kunis"],"rating":8.0,"votes":790000,"runtime":108,"language":"English","country":"USA","plot":"A committed dancer wins the lead role in Swan Lake but struggles to maintain her sanity.","mood":["Dark","Intense","Disturbing"],"era":"2010s","style":"Psychological Horror","tmdb_id":37799},
    {"id":47,"title":"Portrait of a Lady on Fire","year":2019,"genres":["Drama","Romance"],"director":"Céline Sciamma","cast":["Noémie Merlant","Adèle Haenel"],"rating":8.1,"votes":130000,"runtime":122,"language":"French","country":"France","plot":"On an isolated 18th century island, a painter and her subject fall in love.","mood":["Romantic","Poetic","Emotional"],"era":"2010s","style":"Art House","tmdb_id":614934},
    {"id":48,"title":"The Banshees of Inisherin","year":2022,"genres":["Comedy","Drama"],"director":"Martin McDonagh","cast":["Colin Farrell","Brendan Gleeson"],"rating":7.7,"votes":190000,"runtime":114,"language":"English","country":"Ireland","plot":"Two lifelong friends find themselves at an impasse when one abruptly ends their friendship.","mood":["Melancholic","Dark","Quiet"],"era":"2020s","style":"Art House","tmdb_id":674324},
    {"id":49,"title":"Eternal Sunshine of the Spotless Mind","year":2004,"genres":["Drama","Romance","Sci-Fi"],"director":"Michel Gondry","cast":["Jim Carrey","Kate Winslet"],"rating":8.3,"votes":940000,"runtime":108,"language":"English","country":"USA","plot":"A couple erases memories of each other after their relationship turns sour.","mood":["Romantic","Melancholic","Unique"],"era":"2000s","style":"Sci-Fi Romance","tmdb_id":38},
    {"id":50,"title":"The Pianist","year":2002,"genres":["Biography","Drama","Music"],"director":"Roman Polanski","cast":["Adrien Brody","Thomas Kretschmann"],"rating":8.5,"votes":730000,"runtime":150,"language":"English","country":"Poland","plot":"A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto of World War II.","mood":["Emotional","Heavy","Powerful"],"era":"2000s","style":"Historical Drama","tmdb_id":423},
]

# Fix the bad tmdb_id string
for m in MOVIES:
    if isinstance(m.get('tmdb_id'), str):
        m['tmdb_id'] = int(m['tmdb_id'].replace('"','').strip()) if m['tmdb_id'].strip('"').isdigit() else 0

df = pd.DataFrame(MOVIES)
df['genres_str'] = df['genres'].apply(lambda x: ' '.join(x))
df['mood_str']   = df['mood'].apply(lambda x: ' '.join(x))
df['cast_str']   = df['cast'].apply(lambda x: ' '.join(x))
df['combined']   = df['genres_str']+' '+df['mood_str']+' '+df['director']+' '+df['cast_str']+' '+df['era']+' '+df['style']+' '+df['plot']

tfidf = TfidfVectorizer(stop_words='english', ngram_range=(1,2))
tfidf_matrix = tfidf.fit_transform(df['combined'])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# ── POSTER CACHE ──
poster_cache = {}

def get_poster_url(tmdb_id, title=''):
    if tmdb_id in poster_cache:
        return poster_cache[tmdb_id]
    if not TMDB_KEY or not tmdb_id:
        return None
    try:
        r = requests.get(f"{TMDB_BASE}/movie/{tmdb_id}", params={'api_key': TMDB_KEY}, timeout=3)
        if r.ok:
            path = r.json().get('poster_path')
            url = f"{TMDB_IMG}{path}" if path else None
            poster_cache[tmdb_id] = url
            return url
    except:
        pass
    return None

# ── AUTH HELPERS ──
def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def get_current_user():
    token = request.headers.get('X-Session-Token') or request.cookies.get('session_token')
    return db_get_session(token) if token else None

def require_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or not db_user_exists(user):
            return jsonify({'error': 'Unauthorized', 'code': 401}), 401
        return f(*args, **kwargs)
    return decorated

def user_data(username):
    return db_get_user(username) or {}

# ── FORMAT MOVIE ──
def fmt(row, username=None):
    m = row if isinstance(row, dict) else row.to_dict()
    uid = int(m['id'])
    ud = user_data(username) if username else {}
    poster = get_poster_url(m.get('tmdb_id', 0), m.get('title',''))
    return {
        'id': uid,
        'title': m['title'],
        'year': int(m['year']),
        'genres': m['genres'] if isinstance(m['genres'], list) else json.loads(m['genres']),
        'director': m['director'],
        'cast': m['cast'] if isinstance(m['cast'], list) else json.loads(m['cast']),
        'rating': float(m['rating']),
        'runtime': int(m['runtime']),
        'language': m['language'],
        'country': m['country'],
        'plot': m['plot'],
        'mood': m['mood'] if isinstance(m['mood'], list) else json.loads(m['mood']),
        'era': m['era'],
        'style': m['style'],
        'votes': int(m['votes']),
        'tmdb_id': int(m.get('tmdb_id') or 0),
        'poster_url': poster,
        'in_watchlist': uid in ud.get('watchlist', []),
        'user_rating': ud.get('ratings', {}).get(uid),
    }

def similar_ids(movie_id, n=8):
    idx = df.index[df['id'] == movie_id]
    if not len(idx): return []
    idx = idx[0]
    scores = sorted(enumerate(cosine_sim[idx]), key=lambda x: x[1], reverse=True)
    return [int(df.iloc[i[0]]['id']) for i in scores if i[0] != idx][:n]

# ══════════════════════════════════════════════════════
#  AUTH ROUTES
# ══════════════════════════════════════════════════════

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username','').strip().lower()
    password = data.get('password','')
    email    = data.get('email','').strip().lower()
    if not username or not password or not email:
        return jsonify({'error': 'All fields required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if db_user_exists(username):
        return jsonify({'error': 'Username already taken'}), 409
    db_create_user(username, email, hash_password(password))
    token = str(uuid.uuid4())
    db_create_session(token, username)
    return jsonify({'token': token, 'username': username, 'email': email}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username','').strip().lower()
    password = data.get('password','')
    user = db_get_user(username)
    if not user or user['password_hash'] != hash_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    token = str(uuid.uuid4())
    db_create_session(token, username)
    return jsonify({'token': token, 'username': username, 'email': user['email']})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    token = request.headers.get('X-Session-Token') or request.cookies.get('session_token')
    db_delete_session(token)
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def me():
    username = get_current_user()
    u = db_get_user(username)
    return jsonify({'username': username, 'email': u['email'], 'created_at': u['created_at'],
                    'watchlist': u['watchlist'], 'ratings': u['ratings'],
                    'watchlist_count': len(u['watchlist']), 'rated_count': len(u['ratings'])})

# ══════════════════════════════════════════════════════
#  MOVIE ROUTES
# ══════════════════════════════════════════════════════

@app.route('/api/health')
def health():
    return jsonify({'status':'ok','movies':len(df),'users':db_user_count(),'tmdb':bool(TMDB_KEY)})

@app.route('/api/movies')
def get_movies():
    username = get_current_user()
    genre  = request.args.get('genre','')
    era    = request.args.get('era','')
    mood   = request.args.get('mood','')
    sort   = request.args.get('sort','rating')
    limit  = int(request.args.get('limit', 50))
    result = df.copy()
    if genre: result = result[result['genres_str'].str.contains(genre, case=False, na=False)]
    if era:   result = result[result['era'] == era]
    if mood:  result = result[result['mood_str'].str.contains(mood, case=False, na=False)]
    if sort == 'year':  result = result.sort_values('year', ascending=False)
    elif sort == 'votes': result = result.sort_values('votes', ascending=False)
    else: result = result.sort_values('rating', ascending=False)
    movies = [fmt(row, username) for _, row in result.head(limit).iterrows()]
    return jsonify({'movies': movies, 'total': len(movies)})

@app.route('/api/movies/<int:movie_id>')
def get_movie(movie_id):
    username = get_current_user()
    row = df[df['id'] == movie_id]
    if row.empty: return jsonify({'error':'Not found'}), 404
    # History tracking skipped (not persisted in this version)
    movie = fmt(row.iloc[0], username)
    sim_ids = similar_ids(movie_id, 6)
    movie['similar'] = [fmt(df[df['id']==sid].iloc[0], username) for sid in sim_ids if not df[df['id']==sid].empty]
    return jsonify(movie)

@app.route('/api/search')
def search():
    username = get_current_user()
    q = request.args.get('q','').strip().lower()
    if not q: return jsonify({'movies':[]})
    result = df[
        df['title'].str.lower().str.contains(q,na=False) |
        df['director'].str.lower().str.contains(q,na=False) |
        df['cast_str'].str.lower().str.contains(q,na=False) |
        df['genres_str'].str.lower().str.contains(q,na=False) |
        df['mood_str'].str.lower().str.contains(q,na=False) |
        df['plot'].str.lower().str.contains(q,na=False)
    ]
    return jsonify({'movies':[fmt(r, username) for _,r in result.head(20).iterrows()],'total':len(result)})

@app.route('/api/recommend/similar/<int:movie_id>')
def rec_similar(movie_id):
    username = get_current_user()
    ids = similar_ids(movie_id, 8)
    recs = [fmt(df[df['id']==sid].iloc[0], username) for sid in ids if not df[df['id']==sid].empty]
    return jsonify({'recommendations': recs})

@app.route('/api/recommend/mood')
def rec_mood():
    username = get_current_user()
    mood  = request.args.get('mood','')
    era   = request.args.get('era','')
    result = df.copy()
    if mood: result = result[result['mood_str'].str.contains(mood, case=False, na=False)]
    if era:  result = result[result['era'] == era]
    result = result.sort_values('rating', ascending=False)
    return jsonify({'recommendations':[fmt(r, username) for _,r in result.head(12).iterrows()]})

@app.route('/api/recommend/director')
def rec_director():
    username = get_current_user()
    director = request.args.get('director','')
    if not director:
        dirs = df.groupby('director').agg(avg_rating=('rating','mean'), count=('id','count')).reset_index()
        return jsonify({'directors': dirs[dirs['count']>=2].sort_values('avg_rating',ascending=False).to_dict('records')})
    dl = director.lower()
    movies = df[df['director'].str.lower().str.contains(dl,na=False)].sort_values('rating',ascending=False)
    style = movies.iloc[0]['style'] if not movies.empty else ''
    similar_style = df[(df['style']==style)&(~df['director'].str.lower().str.contains(dl,na=False))].sort_values('rating',ascending=False).head(4)
    return jsonify({'movies':[fmt(r,username) for _,r in movies.iterrows()],'director':director,'similar_style':[fmt(r,username) for _,r in similar_style.iterrows()]})

@app.route('/api/recommend/hybrid')
@require_auth
def rec_hybrid():
    username = get_current_user()
    ud = db_get_user(username)
    liked = [mid for mid,r in ud['ratings'].items() if r >= 4]
    seen  = set(list(ud['ratings'].keys()))
    if liked:
        scores = {}
        for mid in liked:
            idx = df.index[df['id']==mid]
            if not len(idx): continue
            for i, sc in enumerate(cosine_sim[idx[0]]):
                mid2 = int(df.iloc[i]['id'])
                if mid2 not in seen:
                    scores[mid2] = scores.get(mid2, 0) + sc
        top = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:10]
        recs = [fmt(df[df['id']==mid].iloc[0], username) for mid,_ in top if not df[df['id']==mid].empty]
    else:
        recs = [fmt(r,username) for _,r in df[~df['id'].isin(seen)].sort_values('rating',ascending=False).head(10).iterrows()]
    return jsonify({'recommendations': recs})

@app.route('/api/filters')
def get_filters():
    return jsonify({
        'genres':    sorted(set(g for gs in df['genres'] for g in gs)),
        'eras':      sorted(df['era'].unique().tolist()),
        'moods':     sorted(set(m for ms in df['mood'] for m in ms)),
        'languages': sorted(df['language'].unique().tolist()),
        'directors': sorted(df['director'].unique().tolist()),
        'styles':    sorted(df['style'].unique().tolist()),
    })

@app.route('/api/stats')
def get_stats():
    username = get_current_user()
    ud = db_get_user(username) if username else {}
    return jsonify({
        'total_movies': len(df),
        'avg_rating': round(float(df['rating'].mean()), 2),
        'user_rated': len(ud.get('ratings',{})),
        'watchlist_count': len(ud.get('watchlist',[])),
        'history_count': len(ud.get('history',[])),
    })

# ── WATCHLIST (auth required) ──
@app.route('/api/watchlist', methods=['GET','POST','DELETE'])
@require_auth
def watchlist():
    username = get_current_user()
    ud = db_get_user(username)
    if request.method == 'GET':
        wl = [fmt(df[df['id']==mid].iloc[0], username) for mid in ud['watchlist'] if not df[df['id']==mid].empty]
        return jsonify({'watchlist': wl})
    mid = int(request.json.get('movie_id'))
    if request.method == 'POST':
        db_watchlist_add(username, mid)
    elif request.method == 'DELETE':
        db_watchlist_remove(username, mid)
    ud = db_get_user(username)
    return jsonify({'success': True, 'watchlist_count': len(ud['watchlist'])})

@app.route('/api/rate', methods=['POST'])
@require_auth
def rate():
    username = get_current_user()
    data = request.json
    mid, rating = int(data['movie_id']), float(data['rating'])
    if not 1 <= rating <= 5: return jsonify({'error':'Rating must be 1-5'}), 400
    db_rate(username, mid, rating)
    return jsonify({'success': True})

@app.route('/api/debug/ratings')
def debug_ratings():
    with get_db() as conn:
        rows = conn.execute("SELECT username, movie_id, rating FROM ratings ORDER BY username, movie_id").fetchall()
        data = [dict(r) for r in rows]
        return jsonify({'ratings': data, 'count': len(data)})

@app.route('/api/debug/watchlist')
def debug_watchlist():
    with get_db() as conn:
        rows = conn.execute("SELECT username, movie_id FROM watchlist ORDER BY username, movie_id").fetchall()
        data = [dict(r) for r in rows]
        return jsonify({'watchlist': data, 'count': len(data)})

@app.route('/api/debug/users')
def debug_users():
    with get_db() as conn:
        rows = conn.execute("SELECT username, email, created_at FROM users").fetchall()
        data = [dict(r) for r in rows]
        return jsonify({'users': data, 'count': len(data)})

if __name__ == '__main__':
    print("🎬 CineMatch API → http://localhost:5000")
    print(f"   TMDB images: {'enabled' if TMDB_KEY else 'disabled (set TMDB_API_KEY env var)'}")
    app.run(debug=True, host='0.0.0.0', port=5000)
