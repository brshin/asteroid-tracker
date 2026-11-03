import { useState, useEffect, useRef } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import AsteroidMark from './AsteroidMark.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const GUEST_SESSION_KEY = 'asteroid-tracker-guest';
const LOCAL_VAULT_KEY = 'asteroid-tracker-guest-vault';

function readGuestFlag() {
    try {
        return sessionStorage.getItem(GUEST_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

function writeGuestFlag(enabled) {
    try {
        if (enabled) {
            sessionStorage.setItem(GUEST_SESSION_KEY, '1');
        } else {
            sessionStorage.removeItem(GUEST_SESSION_KEY);
        }
    } catch {
        // sessionStorage may be unavailable; in-memory state still works for the session
    }
}

function readLocalVault() {
    try {
        const raw = localStorage.getItem(LOCAL_VAULT_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeLocalVault(favorites) {
    try {
        localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(favorites));
    } catch {
        // localStorage may be unavailable
    }
}

function clearLocalVault() {
    try {
        localStorage.removeItem(LOCAL_VAULT_KEY);
    } catch {
        // localStorage may be unavailable
    }
}

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

async function syncLocalVaultToServer(token) {
    const localFavorites = readLocalVault();
    if (localFavorites.length === 0) {
        return 0;
    }

    let synced = 0;

    for (const item of localFavorites) {
        try {
            const postRes = await fetch(`${API_BASE_URL}/asteroids/favorites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: item.name,
                    potentiallyHazardous: item.potentiallyHazardous,
                }),
            });

            if (postRes.ok) {
                synced += 1;
            }

            if (item.note) {
                await fetch(`${API_BASE_URL}/asteroids/favorites/${encodeURIComponent(item.name)}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ note: item.note }),
                });
            }
        } catch (err) {
            console.error('Failed to sync local favorite:', item.name, err);
        }
    }

    clearLocalVault();
    return synced;
}

function App() {
    const [asteroids, setAsteroids] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [editingName, setEditingName] = useState(null);
    const [draftNote, setDraftNote] = useState('');
    const [isGuest, setIsGuest] = useState(readGuestFlag);
    const toastTimer = useRef(null);
    const syncAttempted = useRef(false);

    const { getToken, isLoaded, isSignedIn } = useAuth();
    const canBrowse = isSignedIn || isGuest;

    const showToast = (message) => {
        setToast(message);
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    };

    const enterAsGuest = () => {
        writeGuestFlag(true);
        setIsGuest(true);
    };

    const exitGuest = () => {
        writeGuestFlag(false);
        setIsGuest(false);
        setAsteroids([]);
        setFavorites([]);
        setEditingName(null);
        setDraftNote('');
        setIsLoading(false);
    };

    useEffect(() => {
        if (isSignedIn && isGuest) {
            writeGuestFlag(false);
            setIsGuest(false);
        }
    }, [isSignedIn, isGuest]);

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        if (!isSignedIn && !isGuest) {
            setAsteroids([]);
            setFavorites([]);
            setIsLoading(false);
            syncAttempted.current = false;
            return;
        }

        const fetchAllData = async () => {
            setIsLoading(true);

            try {
                if (isSignedIn) {
                    const token = await getToken();

                    if (!syncAttempted.current) {
                        syncAttempted.current = true;
                        const syncedCount = await syncLocalVaultToServer(token);
                        if (syncedCount > 0) {
                            showToast(`Synced ${syncedCount} local favorite${syncedCount === 1 ? '' : 's'} to your vault.`);
                        }
                    }

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
                } else {
                    const asteroidsRes = await fetch(`${API_BASE_URL}/asteroids`);

                    if (asteroidsRes.ok) {
                        const asteroidsData = await asteroidsRes.json();
                        console.log("Data from backend (asteroids):", asteroidsData);
                        setAsteroids(asteroidsData);
                    }

                    setFavorites(readLocalVault());
                }
            }
            catch (err) {
                console.error("Error fetching all data:", err);
                showToast(err.message);
            }
            finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [isLoaded, isSignedIn, isGuest, getToken]);

    const handleSaveAsteroid = async (asteroid) => {
        if (!isSignedIn) {
            setFavorites((prevFavorites) => {
                if (prevFavorites.some((item) => item.name === asteroid.name)) {
                    return prevFavorites;
                }

                const next = [
                    ...prevFavorites,
                    {
                        name: asteroid.name,
                        potentiallyHazardous: asteroid.potentiallyHazardous,
                        estimatedDiameter: asteroid.estimatedDiameter,
                        note: '',
                    },
                ];
                writeLocalVault(next);
                return next;
            });
            showToast('Saved on this device. Sign in to sync your vault.');
            return;
        }

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
        if (!isSignedIn) {
            setFavorites((prevFavorites) => {
                const next = prevFavorites.filter((ast) => ast.name !== asteroidName);
                writeLocalVault(next);
                return next;
            });
            if (editingName === asteroidName) {
                setEditingName(null);
                setDraftNote('');
            }
            return;
        }

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
        if (!isSignedIn) {
            setFavorites((prevFavorites) => {
                const next = prevFavorites.map((ast) =>
                    ast.name === asteroidName ? { ...ast, note: newNote } : ast
                );
                writeLocalVault(next);
                return next;
            });
            setEditingName(null);
            setDraftNote('');
            showToast('Note saved on this device.');
            return;
        }

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
    const todayLabel = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="min-h-screen font-sans text-ink">
            <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
                {isGuest ? (
                    <button
                        type="button"
                        onClick={exitGuest}
                        className="font-display text-sm font-bold tracking-[0.18em] uppercase text-ink transition-colors hover:text-signal md:text-base"
                        aria-label="Back to welcome"
                    >
                        Asteroid Tracker
                    </button>
                ) : (
                    <p className="font-display text-sm font-bold tracking-[0.18em] uppercase text-ink md:text-base">
                        Asteroid Tracker
                    </p>
                )}

                <div className="flex items-center gap-3">
                    <SignedOut>
                        {isGuest && (
                            <>
                                <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft sm:inline">
                                    Guest
                                </span>
                                <button
                                    type="button"
                                    onClick={exitGuest}
                                    className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-signal"
                                >
                                    Exit guest
                                </button>
                            </>
                        )}
                        <SignInButton mode="modal">
                            <button className="border border-ink/20 bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-signal hover:text-signal">
                                Sign in
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </header>

            {!canBrowse && (
                <section className="relative flex min-h-[calc(100vh-4.5rem)] items-center overflow-hidden px-5 pb-16 pt-8 md:px-10">
                    <div
                        className="pointer-events-none absolute right-[-12%] top-[4%] hidden lg:block"
                        aria-hidden="true"
                    >
                        <div className="hero-orbit animate-orbit">
                            <span className="hero-orbit-dot" />
                        </div>
                        <div className="sky-band absolute left-[18%] top-[42%] h-px w-[64%] bg-gradient-to-r from-transparent via-signal/55 to-transparent" />
                    </div>

                    <div className="relative z-10 w-full max-w-xl animate-fade-rise lg:max-w-2xl">
                        <h1 className="font-display text-[clamp(2.75rem,7vw,5.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink">
                            Asteroid
                            <br />
                            Tracker
                        </h1>
                        <p className="mt-7 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
                            Today&apos;s near-Earth objects from NASA NeoWs — browse as a guest, or sign in to keep a private watch list.
                        </p>
                        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={enterAsGuest}
                                className="bg-signal px-7 py-3.5 text-sm font-semibold tracking-wide text-signal-ink transition-opacity hover:opacity-90"
                            >
                                Continue as guest
                            </button>
                            <SignInButton mode="modal">
                                <button className="border border-ink/25 bg-transparent px-7 py-3.5 text-sm font-semibold tracking-wide text-ink transition-colors hover:border-ink">
                                    Sign in
                                </button>
                            </SignInButton>
                        </div>
                    </div>
                </section>
            )}

            {canBrowse && (
                <>
                {isLoading ? (
                    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center animate-fade-rise">
                        <div className="relative mb-8 h-20 w-20" aria-hidden="true">
                            <div className="absolute inset-0 rounded-full border border-ink/15" />
                            <div className="absolute inset-0 animate-orbit">
                                <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
                            </div>
                        </div>
                        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">Catalog coming online</h2>
                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                            The archive is waking from idle. This can take up to 30 seconds.
                        </p>
                    </div>
                ) : (
                    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-4 md:px-10">
                        <section className="animate-fade-rise">
                            <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <h2 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
                                        Today&apos;s catalog
                                    </h2>
                                    <p className="mt-2 font-mono text-xs tracking-[0.04em] text-ink-soft md:text-sm">
                                        {todayLabel}
                                        {asteroids.length > 0 && (
                                            <span> · {asteroids.length} objects</span>
                                        )}
                                    </p>
                                </div>
                                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                                    Source <span className="text-signal">NASA NeoWs</span>
                                </p>
                            </div>

                            <ul className="divide-y divide-line border-y border-line">
                                {asteroids.map((asteroid, index) => {
                                    const isFavorited = favoriteNames.has(asteroid.name);
                                    const scale = scaleFromDiameter(asteroid.estimatedDiameter, maxDiameter);
                                    const diameterLabel = formatDiameter(asteroid.estimatedDiameter);
                                    const barWidth = maxDiameter
                                        ? Math.max(8, (Number(asteroid.estimatedDiameter) / maxDiameter) * 100)
                                        : 0;

                                    return (
                                        <li
                                            key={asteroid.name}
                                            className="grid grid-cols-1 items-center gap-5 py-6 animate-fade-rise md:grid-cols-[4.5rem_minmax(0,1.4fr)_7rem_minmax(0,1fr)_auto]"
                                            style={{ animationDelay: `${index * 45}ms` }}
                                        >
                                            <div className="flex items-center justify-start md:justify-center">
                                                <AsteroidMark size={`${3.1 * scale}rem`} />
                                            </div>

                                            <div>
                                                <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
                                                    {asteroid.name}
                                                </h3>
                                            </div>

                                            <p
                                                className={`font-mono text-[11px] font-medium uppercase tracking-[0.18em] ${
                                                    asteroid.potentiallyHazardous ? 'text-hazard' : 'text-safe'
                                                }`}
                                            >
                                                {asteroid.potentiallyHazardous ? 'PHA' : 'Non-PHA'}
                                            </p>

                                            <div className="min-w-0">
                                                {diameterLabel && (
                                                    <>
                                                        <p className="mb-2 font-mono text-sm tabular-nums text-ink-soft">
                                                            {diameterLabel}
                                                        </p>
                                                        <div className="h-[3px] w-full bg-line/80">
                                                            <div
                                                                className="diameter-bar h-[3px] bg-signal"
                                                                style={{
                                                                    width: `${barWidth}%`,
                                                                    animationDelay: `${120 + index * 45}ms`,
                                                                }}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="md:justify-self-end">
                                                <button
                                                    onClick={() => handleSaveAsteroid(asteroid)}
                                                    disabled={isFavorited}
                                                    className={`w-full px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors md:w-auto ${
                                                        isFavorited
                                                            ? 'cursor-not-allowed border border-line text-ink-soft'
                                                            : 'bg-ink text-panel hover:bg-signal hover:text-signal-ink'
                                                    }`}
                                                >
                                                    {isFavorited ? 'In vault' : 'Favorite'}
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>

                        <section className="mt-20 animate-fade-rise" style={{ animationDelay: '120ms' }}>
                            <div className="mb-8 border-b border-line pb-6">
                                <h2 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
                                    The vault
                                </h2>
                                <p className="mt-2 max-w-xl text-sm text-ink-soft">
                                    {isSignedIn
                                        ? 'Private watch list and commander\'s log synced to your account.'
                                        : 'Saved on this device · Sign in to sync across sessions.'}
                                </p>
                            </div>

                            {favorites.length === 0 ? (
                                <div className="border border-dashed border-line px-6 py-14 text-ink-soft">
                                    <p className="text-base">The vault is empty. Choose an object from today&apos;s catalog.</p>
                                    {!isSignedIn && (
                                        <div className="mt-6">
                                            <SignInButton mode="modal">
                                                <button className="border border-ink/20 bg-panel px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-signal hover:text-signal">
                                                    Sign in to sync later
                                                </button>
                                            </SignInButton>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <ul className="divide-y divide-line border-y border-line">
                                    {favorites.map((asteroid, index) => {
                                        const scale = scaleFromDiameter(asteroid.estimatedDiameter, maxDiameter);
                                        const diameterLabel = formatDiameter(asteroid.estimatedDiameter);

                                        return (
                                            <li
                                                key={asteroid.name}
                                                className="grid grid-cols-1 gap-5 py-7 animate-fade-rise md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.2fr)]"
                                                style={{ animationDelay: `${index * 45}ms` }}
                                            >
                                                <div className="flex items-start justify-start md:justify-center">
                                                    <AsteroidMark size={`${3.1 * scale}rem`} />
                                                </div>

                                                <div>
                                                    <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
                                                        {asteroid.name}
                                                    </h3>
                                                    <p
                                                        className={`mt-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] ${
                                                            asteroid.potentiallyHazardous ? 'text-hazard' : 'text-safe'
                                                        }`}
                                                    >
                                                        {asteroid.potentiallyHazardous ? 'PHA' : 'Non-PHA'}
                                                        {diameterLabel && (
                                                            <span className="text-ink-soft"> · {diameterLabel}</span>
                                                        )}
                                                    </p>

                                                    <div className="mt-5 flex flex-wrap gap-2">
                                                        {editingName !== asteroid.name && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingName(asteroid.name);
                                                                        setDraftNote(asteroid.note || '');
                                                                    }}
                                                                    className="border border-ink/20 bg-panel px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveAsteroid(asteroid.name)}
                                                                    className="border border-transparent px-4 py-2 text-sm font-semibold text-hazard transition-colors hover:border-hazard/40"
                                                                >
                                                                    Drop
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    {editingName === asteroid.name ? (
                                                        <div className="border border-line bg-panel p-4">
                                                            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                                                                Commander&apos;s log
                                                            </label>
                                                            <textarea
                                                                value={draftNote}
                                                                onChange={(event) => setDraftNote(event.target.value)}
                                                                rows={3}
                                                                className="w-full resize-none border border-line bg-white p-3 text-sm text-ink outline-none focus:border-signal"
                                                            />
                                                            <div className="mt-3 flex gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateNote(asteroid.name, draftNote)}
                                                                    className="bg-ink px-4 py-2 text-sm font-semibold text-panel transition-colors hover:bg-signal hover:text-signal-ink"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingName(null);
                                                                        setDraftNote('');
                                                                    }}
                                                                    className="border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-ink/40 hover:text-ink"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="border border-line bg-panel/80 p-4">
                                                            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                                                                Commander&apos;s log
                                                            </span>
                                                            <p className="text-sm italic leading-relaxed text-ink-soft">
                                                                {asteroid.note || 'No notes yet.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    </main>
                )}
                </>
            )}

            {toast && (
                <div
                    role="status"
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-line bg-panel px-4 py-3 text-sm text-ink animate-fade-rise"
                >
                    {toast}
                </div>
            )}
        </div>
    );
}

export default App;
