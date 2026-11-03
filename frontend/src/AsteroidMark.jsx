import { useId } from 'react';

const VARIANTS = [
    {
        // scarred irregular lump — hard notches, not a sphere
        body: 'M22 40L18 28L28 14L44 8L62 12L78 22L88 38L92 54L84 70L72 82L54 90L34 88L20 74L14 58Z',
        sheen: 'M28 14L44 8L62 12L78 22L82 30L66 20L46 14L32 18Z',
        ridges: [
            'M26 36L40 30L52 38',
            'M48 52L62 58L74 66',
            'M34 60L42 70',
        ],
        craters: [
            { cx: 40, cy: 36, rx: 10, ry: 7.5, rot: -26 },
            { cx: 66, cy: 56, rx: 7, ry: 6.5, rot: 14 },
            { cx: 34, cy: 66, rx: 5, ry: 4, rot: 28 },
        ],
        palette: {
            mid: '#b7a48a',
            deep: '#6a5a45',
            core: '#3f3529',
            light: '#ebe1d2',
        },
    },
    {
        // angular crystalline chunk
        body: 'M20 26L42 4L72 10L94 34L86 62L70 86L40 94L12 72L8 46Z',
        sheen: 'M42 4L72 10L88 28L74 18L50 10L34 16Z',
        ridges: [
            'M26 40L44 28L60 42',
            'M38 64L58 72L74 58',
            'M52 48L64 54',
        ],
        craters: [
            { cx: 44, cy: 40, rx: 9.5, ry: 8, rot: -12 },
            { cx: 68, cy: 52, rx: 6, ry: 5.5, rot: 22 },
            { cx: 34, cy: 70, rx: 4.5, ry: 4, rot: -8 },
        ],
        palette: {
            mid: '#9e9688',
            deep: '#585247',
            core: '#343029',
            light: '#e5e0d6',
        },
    },
    {
        // lobed twin-mass
        body: 'M26 22L40 8L58 10L74 20L86 36L90 52L80 64L88 78L74 90L52 94L32 86L18 70L12 50L16 34Z',
        sheen: 'M40 8L58 10L74 20L82 30L68 20L48 12L36 16Z',
        ridges: [
            'M30 38L46 32L58 42',
            'M46 58L60 68L74 72',
            'M28 56L36 66',
        ],
        craters: [
            { cx: 38, cy: 36, rx: 8.5, ry: 7, rot: -16 },
            { cx: 64, cy: 48, rx: 7.5, ry: 6, rot: 18 },
            { cx: 48, cy: 72, rx: 5.5, ry: 4.5, rot: 6 },
        ],
        palette: {
            mid: '#c2a882',
            deep: '#745a3b',
            core: '#453524',
            light: '#f0e4d0',
        },
    },
    {
        // jagged wedge / shard
        body: 'M14 52L22 24L40 6L64 8L86 24L96 48L88 70L76 86L54 94L30 88L16 70Z',
        sheen: 'M40 6L64 8L86 24L90 34L72 18L50 12L36 16Z',
        ridges: [
            'M28 42L44 34L56 46',
            'M52 58L66 68L78 74',
            'M36 62L48 74',
        ],
        craters: [
            { cx: 42, cy: 34, rx: 9, ry: 7.5, rot: -30 },
            { cx: 66, cy: 54, rx: 7, ry: 7.5, rot: 10 },
            { cx: 34, cy: 66, rx: 5, ry: 4.5, rot: 32 },
            { cx: 58, cy: 28, rx: 3.2, ry: 2.8, rot: -10 },
        ],
        palette: {
            mid: '#a8987c',
            deep: '#5e4f3a',
            core: '#382f24',
            light: '#e8dcc8',
        },
    },
];

export function variantFromName(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 33 + name.charCodeAt(i)) >>> 0;
    }
    return hash % VARIANTS.length;
}

export default function AsteroidMark({
    size = 48,
    className = '',
    variant = 0,
    hazardous = false,
}) {
    const id = useId().replace(/:/g, '');
    const shape = VARIANTS[variant % VARIANTS.length];
    const body = `${id}-body`;
    const sheen = `${id}-sheen`;
    const crater = `${id}-crater`;
    const shade = `${id}-shade`;
    const { palette } = shape;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={className}
            aria-hidden="true"
        >
            <defs>
                <radialGradient id={body} cx="32%" cy="28%" r="78%">
                    <stop offset="0%" stopColor={palette.light} />
                    <stop offset="42%" stopColor={palette.mid} />
                    <stop offset="100%" stopColor={palette.deep} />
                </radialGradient>
                <radialGradient id={sheen} cx="28%" cy="22%" r="50%">
                    <stop offset="0%" stopColor="#fff8ef" stopOpacity="0.55" />
                    <stop offset="60%" stopColor="#fff8ef" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#fff8ef" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={crater} cx="38%" cy="32%" r="70%">
                    <stop offset="0%" stopColor={palette.core} />
                    <stop offset="65%" stopColor={palette.deep} />
                    <stop offset="100%" stopColor={palette.mid} stopOpacity="0.85" />
                </radialGradient>
                <radialGradient id={shade} cx="72%" cy="78%" r="58%">
                    <stop offset="0%" stopColor="#1c1814" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#1c1814" stopOpacity="0" />
                </radialGradient>
            </defs>

            <ellipse cx="52" cy="86" rx="28" ry="5" fill="#101820" opacity="0.08" />

            <path d={shape.body} fill={`url(#${body})`} />
            <path d={shape.sheen} fill={`url(#${sheen})`} />
            <ellipse cx="70" cy="72" rx="24" ry="16" fill={`url(#${shade})`} transform="rotate(-16 70 72)" />

            {shape.ridges.map((d) => (
                <path
                    key={d}
                    d={d}
                    fill="none"
                    stroke={palette.core}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    opacity="0.28"
                />
            ))}

            {shape.craters.map((c) => (
                <g key={`${c.cx}-${c.cy}`}>
                    <ellipse
                        cx={c.cx}
                        cy={c.cy}
                        rx={c.rx}
                        ry={c.ry}
                        fill={`url(#${crater})`}
                        transform={`rotate(${c.rot} ${c.cx} ${c.cy})`}
                    />
                    <ellipse
                        cx={c.cx - c.rx * 0.18}
                        cy={c.cy - c.ry * 0.22}
                        rx={c.rx * 0.55}
                        ry={c.ry * 0.45}
                        fill={palette.core}
                        opacity="0.45"
                        transform={`rotate(${c.rot} ${c.cx} ${c.cy})`}
                    />
                    <ellipse
                        cx={c.cx - c.rx * 0.28}
                        cy={c.cy - c.ry * 0.38}
                        rx={c.rx * 0.22}
                        ry={c.ry * 0.14}
                        fill={palette.light}
                        opacity="0.22"
                        transform={`rotate(${c.rot} ${c.cx} ${c.cy})`}
                    />
                </g>
            ))}

            {hazardous && (
                <circle cx="78" cy="18" r="3.2" fill="#e4572e" />
            )}
        </svg>
    );
}
