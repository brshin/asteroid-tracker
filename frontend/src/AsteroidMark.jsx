import { useId } from 'react';

export default function AsteroidMark({ size = 48, className = '' }) {
    const id = useId().replace(/:/g, '');
    const body = `${id}-body`;
    const sheen = `${id}-sheen`;
    const crater = `${id}-crater`;
    const shade = `${id}-shade`;

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
                <radialGradient id={body} cx="34%" cy="28%" r="72%">
                    <stop offset="0%" stopColor="#d7cfc4" />
                    <stop offset="38%" stopColor="#a79f93" />
                    <stop offset="78%" stopColor="#6f675c" />
                    <stop offset="100%" stopColor="#4a453e" />
                </radialGradient>
                <radialGradient id={sheen} cx="30%" cy="24%" r="55%">
                    <stop offset="0%" stopColor="#f4efe8" stopOpacity="0.55" />
                    <stop offset="55%" stopColor="#f4efe8" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#f4efe8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={crater} cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#3f3b36" />
                    <stop offset="70%" stopColor="#5a544c" />
                    <stop offset="100%" stopColor="#6d665c" />
                </radialGradient>
                <radialGradient id={shade} cx="70%" cy="78%" r="55%">
                    <stop offset="0%" stopColor="#2d2a26" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#2d2a26" stopOpacity="0" />
                </radialGradient>
            </defs>

            <path
                d="M50.2 8.4C68.4 6.2 85.1 16.8 90.8 34.1C96.4 51.2 89.2 70.4 76.1 82.6C63.2 94.7 42.4 97.2 27.1 88.4C12.1 79.8 5.8 61.4 11.2 44.6C16.5 28.1 32.4 10.5 50.2 8.4Z"
                fill={`url(#${body})`}
            />
            <path
                d="M50.2 8.4C68.4 6.2 85.1 16.8 90.8 34.1C93.4 42.1 92.6 50.8 88.9 58.4C84.1 44.6 70.8 28.8 52.6 20.4C46.8 17.8 41.1 13.2 37.4 10.8C41.5 9.2 45.8 8.6 50.2 8.4Z"
                fill={`url(#${sheen})`}
            />
            <ellipse cx="72" cy="70" rx="22" ry="16" fill={`url(#${shade})`} transform="rotate(-18 72 70)" />

            <ellipse cx="40" cy="40" rx="12.5" ry="9.5" fill={`url(#${crater})`} transform="rotate(-16 40 40)" />
            <ellipse cx="37.5" cy="37.8" rx="7.2" ry="4.8" fill="#2a2723" opacity="0.45" transform="rotate(-16 37.5 37.8)" />
            <ellipse cx="35.8" cy="35.4" rx="3.4" ry="1.8" fill="#ebe4da" opacity="0.18" transform="rotate(-16 35.8 35.4)" />

            <ellipse cx="68" cy="58" rx="8.5" ry="8.5" fill={`url(#${crater})`} />
            <ellipse cx="66.2" cy="56" rx="4.6" ry="4.6" fill="#2a2723" opacity="0.42" />
            <ellipse cx="64.6" cy="54.2" rx="2" ry="1.2" fill="#ebe4da" opacity="0.16" />

            <ellipse cx="26" cy="64" rx="6.2" ry="5" fill={`url(#${crater})`} transform="rotate(18 26 64)" />
            <ellipse cx="24.6" cy="62.6" rx="3.1" ry="2.3" fill="#2a2723" opacity="0.4" transform="rotate(18 24.6 62.6)" />

            <ellipse cx="58" cy="28" rx="4.2" ry="3.4" fill={`url(#${crater})`} transform="rotate(-28 58 28)" />
            <ellipse cx="57" cy="27" rx="2" ry="1.4" fill="#2a2723" opacity="0.35" transform="rotate(-28 57 27)" />

            <path
                d="M18 48C16.2 41.5 17.4 34.8 21 29.6"
                stroke="#3f3b36"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.28"
                fill="none"
            />
            <path
                d="M74 42C78.5 46.8 80.6 53.4 79.8 59.8"
                stroke="#3f3b36"
                strokeWidth="1.3"
                strokeLinecap="round"
                opacity="0.22"
                fill="none"
            />
        </svg>
    );
}
