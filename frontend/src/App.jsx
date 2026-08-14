import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
    const [asteroids, setAsteroids] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { getToken, isLoaded, isSignedIn } = useAuth();

    useEffect(() => {

        if (!isLoaded) {
            return;
        }

        if (!isSignedIn) {
            setIsLoading(false);
            return;
        }

        const fetchAllData = async () => {
            const token = await getToken();

            try {
                const [asteroidsRes, favoritesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/asteroids`),
                    fetch(`${API_BASE_URL}/asteroids/favorites`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (asteroidsRes.ok) {
                    const asteroidsData = await asteroidsRes.json();
                    console.log("Data from backend (asteroids):", asteroidsData);
                    setAsteroids(asteroidsData);
                }
    
                if (favoritesRes.ok) {
                    const favoritesData = await favoritesRes.json();
                    console.log("Data from backend (favorites):", favoritesData);
                    setFavorites(favoritesData);
                }
            }
            catch (err) {
                console.error("Error fetching all data:", err);
                alert(err.message);
            }
            finally {
                setIsLoading(false);
            }
            
        }

        fetchAllData();
        
    }, [isLoaded, isSignedIn, getToken]);

    const handleSaveAsteroid = async (asteroid) => {
        const token = await getToken();
        console.log(token);

        fetch(`${API_BASE_URL}/asteroids/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: asteroid.name,
                potentiallyHazardous: asteroid.potentiallyHazardous
            })
        })
        .then(async (res) => {
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            return data;
        })
        .then(data => console.log("Success! Server says: ", data))
        .then(() => setFavorites(prevFavorites => [...prevFavorites, asteroid]))
        .catch(err => {
            console.error("Failed to add:", err);
            alert(err.message);
        });
    };

    const handleRemoveAsteroid = async (asteroidName) => {
        const token = await getToken();

        fetch(`${API_BASE_URL}/asteroids/favorites/${asteroidName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(async (res) => {
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to delete asteroid");
            }
            return data;
        })
        .then(data => {
            console.log("Success! Server says:", data.message);

            setFavorites(favorites => favorites.filter(ast => ast.name !== asteroidName));
        })
        .catch(err => {
            console.error("Error removing:", err.message);
            alert(err.message);
        });
            
    };

    const handleUpdateNote = async (asteroidName, newNote) => {
        const token = await getToken();

        fetch(`${API_BASE_URL}/asteroids/favorites/${asteroidName}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
            body: JSON.stringify({ note: newNote })
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Could not save your note");
            }
            return data;
        })
        .then(updatedAsteroid => {
            console.log("Database updated successfully:", updatedAsteroid);

            setFavorites(prevFavorites => 
                prevFavorites.map(ast => 
                    ast.name === asteroidName ? updatedAsteroid : ast
                )
            );
        })
        .catch(err => {
            console.error("Update failed:", err.message);
            alert(`Error saving note: ${err.message}`);
        });
    };

    return (
        <div className="min-h-screen bg-transparent text-[#e8e6e3] font-sans">
            <nav className="flex items-center justify-between px-8 py-5 border-b border-hairline bg-void/70">
                <h1 className="font-serif text-lg uppercase tracking-[0.28em] text-[#e8e6e3]">
                    Asteroid Tracker
                    <span className="mt-1.5 block h-px w-14 bg-accent" />
                </h1>

                <div className="auth-controls">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="rounded-md border border-accent/70 px-4 py-2 text-sm font-medium tracking-wide text-accent transition-colors hover:bg-accent hover:text-void">
                                Sign in
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </nav>

            <SignedOut>
                <div className="flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center px-6 text-center animate-fade-rise">
                    <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-accent">
                        Near-Earth Catalog
                    </p>
                    <h2 className="mb-6 font-serif text-5xl tracking-tight text-[#e8e6e3] md:text-7xl">
                        The Vault
                    </h2>
                    <p className="mb-10 max-w-md text-base leading-relaxed text-muted">
                        Sign in to browse today&apos;s near-Earth objects and keep a private log of those you choose to watch.
                    </p>
                    <SignInButton mode="modal">
                        <button className="border border-accent bg-accent px-8 py-3 text-sm font-medium tracking-wide text-void transition-colors hover:bg-accent/90">
                            Sign in
                        </button>
                    </SignInButton>
                </div>
            </SignedOut>

            <SignedIn>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center my-32 text-center animate-fade-rise">
                        <div className="relative mb-8 h-24 w-24" aria-hidden="true">
                            <div className="absolute inset-0 rounded-full border border-hairline" />
                            <div className="absolute inset-3 rounded-full border border-hairline/70" />
                            <div className="absolute inset-0 animate-orbit">
                                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
                            </div>
                        </div>
                        <h2 className="mb-2 font-serif text-2xl text-[#e8e6e3]">Catalog coming online</h2>
                        <p className="max-w-md px-6 text-sm leading-relaxed text-muted">
                            The archive is waking from idle. This can take up to 30 seconds.
                        </p>
                    </div>
                ) : (
                
                    <main className="max-w-7xl mx-auto p-8">

                        <div className="mb-12">

                            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-700 pb-2 mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold">Today's Asteroids</h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>

                                <div className="mt-2 md:mt-0 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    Source: <span className="text-blue-400">NASA NeoWs API</span>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {asteroids.map((asteroid) => (

                                    /* Card */
                                    <div key={asteroid.name} className="bg-[#161619] border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-2xl hover:border-gray-600">
                                        <img src="/asteroid.svg" alt="Asteroid" className="w-16 h-16 mb-4 opacity-90" />

                                        <h3 className="text-xl font-bold mb-2">{asteroid.name}</h3>

                                        <p className={`font-semibold mb-6 px-3 py-1 rounded-full text-sm ${asteroid.potentiallyHazardous ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}`}>
                                        {asteroid.potentiallyHazardous ? "⚠️ Hazardous" : "✅ Safe"}
                                        </p>

                                        <button 
                                            onClick={() => handleSaveAsteroid(asteroid)}
                                            className="mt-auto w-full py-2 bg-[#2a2a35] hover:bg-blue-600 rounded-lg font-bold transition-colors"
                                        >
                                            Favorite
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-16">
                            <h2 className="text-3xl font-bold border-b border-gray-700 pb-2 mb-6">My Favorite Asteroids</h2>

                            {favorites.length === 0 ? (
                                <div className="text-center py-16 bg-[#161619] rounded-xl border border-dashed border-gray-700 text-gray-500">
                                    <p className="text-lg">Your vault is empty. Go favorite some space rocks above!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {favorites.map((asteroid) => (
                                        <div key={asteroid.name} className="bg-[#161619] border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-2xl hover:border-gray-600">

                                            <img src="/asteroid.svg" alt="Asteroid" className="w-16 h-16 mb-4 opacity-90 drop-shadow-[0_0_12px_rgba(74,78,105,0.6)]" />
                                            
                                            <h3 className="text-xl font-bold mb-2">{asteroid.name}</h3>

                                            <p className={`font-semibold mb-4 px-3 py-1 rounded-full text-xs ${asteroid.potentiallyHazardous ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}`}>
                                                {asteroid.potentiallyHazardous ? "⚠️ Hazardous" : "✅ Safe"}
                                            </p>

                                            <div className="w-full bg-[#0f0f11] rounded-lg p-3 mb-6 text-sm text-gray-300 text-left flex-grow border border-gray-800 shadow-inner">
                                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Commander's Log:</span>
                                                <span className="italic">{asteroid.note || "No notes added yet."}</span>
                                            </div>

                                            <div className="flex gap-2 w-full mt-auto">
                                                <button 
                                                    onClick={() => {
                                                        const userNote = prompt("Enter a custom note for this asteroid:", asteroid.note || "");
                                                        if (userNote !== null) {
                                                            handleUpdateNote(asteroid.name, userNote);
                                                        }
                                                    }}
                                                    className="flex-1 py-2 bg-blue-900/20 text-blue-400 border border-blue-800/50 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-sm transition-all"    
                                                >
                                                    ✍️ Edit
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleRemoveAsteroid(asteroid.name)}
                                                    className="flex-1 py-2 bg-red-900/20 text-red-400 border border-red-800/50 hover:bg-red-600 hover:text-white rounded-lg font-bold text-sm transition-all"
                                                >
                                                    🗑️ Drop
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </main>
                )}
            </SignedIn>

        </div>    

    )

}

export default App;