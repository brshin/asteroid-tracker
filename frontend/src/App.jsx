import { useState, useEffect, useRef } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function scaleFromDiameter(meters, maxMeters) {
    if (!meters || !maxMeters) {
        return 1;
    }
    return 0.72 + (meters / maxMeters) * 0.58;
}

function formatDiameter(meters) {
    if (meters == null || Number.isNaN(Number(meters))) {
        return null;
    }
    return `${Math.round(Number(meters)).toLocaleString('en-US')} m`;
}

function App() {
    const [asteroids, setAsteroids] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [editingName, setEditingName] = useState(null);
    const [draftNote, setDraftNote] = useState('');
    const toastTimer = useRef(null);

    const { getToken, isLoaded, isSignedIn } = useAuth();

    const showToast = (message) => {
        setToast(message);
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    };

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
                showToast(err.message);
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
            showToast(err.message);
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
            showToast(err.message);
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
            setEditingName(null);
            setDraftNote('');
        })
        .catch(err => {
            console.error("Update failed:", err.message);
            showToast(`Error saving note: ${err.message}`);
        });
    };

    const maxDiameter = asteroids.reduce(
        (max, asteroid) => Math.max(max, Number(asteroid.estimatedDiameter) || 0),
        0
    );
    const favoriteNames = new Set(favorites.map((asteroid) => asteroid.name));

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

                            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-hairline pb-3 mb-8">
                                <div>
                                    <h2 className="font-serif text-3xl tracking-tight">Today&apos;s catalog</h2>
                                    <p className="text-muted text-sm mt-1 tabular-nums">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        {asteroids.length > 0 && (
                                            <span className="text-muted/80"> · {asteroids.length} objects</span>
                                        )}
                                    </p>
                                </div>

                                <div className="mt-2 md:mt-0 text-[11px] font-medium text-muted uppercase tracking-[0.22em]">
                                    Source: <span className="text-accent">NASA NeoWs</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {asteroids.map((asteroid, index) => {
                                    const isFavorited = favoriteNames.has(asteroid.name);
                                    const scale = scaleFromDiameter(asteroid.estimatedDiameter, maxDiameter);
                                    const diameterLabel = formatDiameter(asteroid.estimatedDiameter);
                                    const barWidth = maxDiameter
                                        ? Math.max(8, (Number(asteroid.estimatedDiameter) / maxDiameter) * 100)
                                        : 0;

                                    return (
                                    <div
                                        key={asteroid.name}
                                        className="bg-surface/80 border border-hairline rounded-xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_0_24px_rgba(196,165,116,0.12)] animate-fade-rise"
                                        style={{ animationDelay: `${index * 60}ms` }}
                                    >
                                        <img
                                            src="/asteroid.svg"
                                            alt=""
                                            className="mb-4 opacity-90"
                                            style={{ width: `${4 * scale}rem`, height: `${4 * scale}rem` }}
                                        />

                                        <h3 className="font-serif text-xl mb-2">{asteroid.name}</h3>

                                        <p className={`mb-3 text-[11px] font-medium uppercase tracking-[0.2em] ${asteroid.potentiallyHazardous ? "text-hazard" : "text-safe"}`}>
                                            {asteroid.potentiallyHazardous ? "PHA" : "Non-PHA"}
                                        </p>

                                        {diameterLabel && (
                                            <>
                                                <p className="mb-2 tabular-nums text-sm text-muted">{diameterLabel}</p>
                                                <div className="mb-6 h-px w-full bg-hairline">
                                                    <div className="h-px bg-accent/70" style={{ width: `${barWidth}%` }} />
                                                </div>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handleSaveAsteroid(asteroid)}
                                            disabled={isFavorited}
                                            className={`mt-auto w-full py-2 rounded-md text-sm font-medium tracking-wide transition-colors ${
                                                isFavorited
                                                    ? "border border-hairline text-muted cursor-not-allowed"
                                                    : "border border-accent/70 text-accent hover:bg-accent hover:text-void"
                                            }`}
                                        >
                                            {isFavorited ? "In vault" : "Favorite"}
                                        </button>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-16">
                            <h2 className="font-serif text-3xl tracking-tight border-b border-hairline pb-3 mb-8">The vault</h2>

                            {favorites.length === 0 ? (
                                <div className="text-center py-16 rounded-xl border border-dashed border-hairline text-muted">
                                    <p className="text-base">The vault is empty. Choose an object from today&apos;s catalog.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {favorites.map((asteroid, index) => {
                                        const scale = scaleFromDiameter(asteroid.estimatedDiameter, maxDiameter);
                                        const diameterLabel = formatDiameter(asteroid.estimatedDiameter);

                                        return (
                                        <div
                                            key={asteroid.name}
                                            className="bg-surface/80 border border-hairline rounded-xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_0_24px_rgba(196,165,116,0.12)] animate-fade-rise"
                                            style={{ animationDelay: `${index * 60}ms` }}
                                        >
                                            <img
                                                src="/asteroid.svg"
                                                alt=""
                                                className="mb-4 opacity-90"
                                                style={{ width: `${4 * scale}rem`, height: `${4 * scale}rem` }}
                                            />

                                            <h3 className="font-serif text-xl mb-2">{asteroid.name}</h3>

                                            <p className={`mb-3 text-[11px] font-medium uppercase tracking-[0.2em] ${asteroid.potentiallyHazardous ? "text-hazard" : "text-safe"}`}>
                                                {asteroid.potentiallyHazardous ? "PHA" : "Non-PHA"}
                                            </p>

                                            {diameterLabel && (
                                                <p className="mb-4 tabular-nums text-sm text-muted">{diameterLabel}</p>
                                            )}

                                            {editingName === asteroid.name ? (
                                                <div className="w-full mb-2 text-left flex-grow">
                                                    <label className="text-muted text-[10px] font-medium uppercase tracking-[0.2em] block mb-1">
                                                        Commander&apos;s log
                                                    </label>
                                                    <textarea
                                                        value={draftNote}
                                                        onChange={(event) => setDraftNote(event.target.value)}
                                                        rows={3}
                                                        className="w-full resize-none rounded-md border border-accent/40 bg-void/60 p-3 text-sm text-[#e8e6e3] focus:border-accent focus:outline-none"
                                                    />
                                                    <div className="flex gap-2 w-full mt-2">
                                                        <button
                                                            onClick={() => handleUpdateNote(asteroid.name, draftNote)}
                                                            className="flex-1 py-2 border border-accent/50 text-accent hover:bg-accent hover:text-void rounded-md font-medium text-sm transition-colors"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingName(null);
                                                                setDraftNote('');
                                                            }}
                                                            className="flex-1 py-2 border border-hairline text-muted hover:border-muted rounded-md font-medium text-sm transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                            <div className="w-full bg-void/60 rounded-md p-3 mb-6 text-sm text-[#e8e6e3] text-left flex-grow border border-hairline">
                                                <span className="text-muted text-[10px] font-medium uppercase tracking-[0.2em] block mb-1">Commander&apos;s log</span>
                                                <span className="italic text-muted">{asteroid.note || "No notes yet."}</span>
                                            </div>

                                            <div className="flex gap-2 w-full mt-auto">
                                                <button
                                                    onClick={() => {
                                                        setEditingName(asteroid.name);
                                                        setDraftNote(asteroid.note || '');
                                                    }}
                                                    className="flex-1 py-2 border border-accent/50 text-accent hover:bg-accent hover:text-void rounded-md font-medium text-sm transition-colors"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => handleRemoveAsteroid(asteroid.name)}
                                                    className="flex-1 py-2 border border-hairline text-muted hover:border-[#c17a6a]/60 hover:text-[#c17a6a] rounded-md font-medium text-sm transition-colors"
                                                >
                                                    Drop
                                                </button>
                                            </div>
                                                </>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </main>
                )}
            </SignedIn>

            {toast && (
                <div
                    role="status"
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-hairline bg-surface px-4 py-3 text-sm text-[#e8e6e3] shadow-[0_8px_32px_rgba(0,0,0,0.45)] animate-fade-rise"
                >
                    {toast}
                </div>
            )}

        </div>    

    )

}

export default App;