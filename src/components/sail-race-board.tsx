// Illustrated preview of the "sail race" game as it appears on the classroom screen.
// Boats leave Sohar (right) and race toward the old trade port (left).

const TEAMS = [
  { name: "فريق النخيل", color: "var(--palm)", x: 175, score: 7, from: "300px" },
  { name: "فريق اللبان", color: "var(--saffron)", x: 255, score: 6, from: "220px" },
  { name: "فريق الرمان", color: "var(--pomegranate)", x: 335, score: 4, from: "140px" },
];

const LANES = [128, 202, 276];

function Boat({ color }: { color: string }) {
  return (
    <g className="boat-bob">
      <g transform="scale(-1 1)">
      {/* main sail and jib; mirrored so the bow points toward the port */}
      <path d="M2 -46 L2 -6 L28 -6 Z" fill="#fff" />
      <path d="M-2 -38 L-2 -6 L-20 -6 Z" fill={color} />
      <rect x="-1" y="-48" width="3" height="44" rx="1.5" fill="var(--indigo)" />
      {/* hull */}
      <path d="M-30 -4 H34 Q30 10 18 12 H-20 Q-28 8 -30 -4 Z" fill={color} />
      <path d="M-24 2 H28" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function SailRaceBoard() {
  return (
    <figure className="relative">
      <svg
        viewBox="0 0 560 340"
        role="img"
        aria-label="معاينة لعبة سباق السفن الشراعية: ثلاث سفن لفرق الصف تتسابق من صحار نحو الميناء"
        className="h-auto w-full drop-shadow-[0_24px_40px_rgba(15,163,163,0.25)]"
      >
        <defs>
          <clipPath id="board">
            <rect width="560" height="340" rx="28" />
          </clipPath>
          <pattern id="waves" width="48" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 10 Q12 2 24 10 T48 10" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" />
          </pattern>
        </defs>

        <g clipPath="url(#board)">
          <rect width="560" height="340" fill="var(--sea)" />
          <rect y="88" width="560" height="252" fill="url(#waves)" />

          {/* question bar, as the class sees it */}
          <rect x="20" y="18" width="520" height="56" rx="16" fill="#fff" />
          <text x="516" y="53" textAnchor="start" direction="rtl" fontSize="20" fontWeight="700" fill="var(--indigo)">
            قرّب ٧٤٦٢ إلى أقرب مئة
          </text>
          <rect x="34" y="31" width="104" height="30" rx="15" fill="#fff3d6" />
          <text x="86" y="52" textAnchor="middle" direction="rtl" fontSize="14" fontWeight="600" fill="var(--saffron-deep)">
            السؤال ٥ من ١٢
          </text>

          {/* lanes */}
          {LANES.map((y) => (
            <line key={y} x1="60" x2="500" y1={y + 14} y2={y + 14} stroke="#fff" strokeOpacity="0.35" strokeDasharray="2 10" strokeWidth="3" strokeLinecap="round" />
          ))}

          {/* start: Sohar */}
          <rect x="498" y="96" width="6" height="210" rx="3" fill="#fff" fillOpacity="0.8" />
          <text x="501" y="326" textAnchor="middle" direction="rtl" fontSize="15" fontWeight="700" fill="#fff">
            صحار
          </text>

          {/* finish: port with flag */}
          <rect x="20" y="96" width="34" height="210" rx="10" fill="var(--saffron)" />
          <path d="M37 102 V128 M37 102 L52 108 L37 114" stroke="var(--indigo)" strokeWidth="3" fill="var(--pomegranate)" strokeLinejoin="round" />
          <text x="37" y="326" textAnchor="middle" direction="rtl" fontSize="15" fontWeight="700" fill="#fff">
            الميناء
          </text>

          {/* boats */}
          {TEAMS.map((t, i) => (
            <g key={t.name} transform={`translate(${t.x} ${LANES[i]})`}>
              <g className="boat" style={{ ["--sail-from" as string]: t.from, animationDelay: `${i * 120}ms` }}>
                <Boat color={t.color} />
                <g transform="translate(46 -30)">
                  <rect x="0" y="-14" width="36" height="26" rx="13" fill="#fff" />
                  <text x="18" y="5" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--indigo)">
                    {"٠١٢٣٤٥٦٧٨٩"[t.score]}
                  </text>
                </g>
              </g>
            </g>
          ))}
        </g>
      </svg>

      <figcaption className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
        {TEAMS.map((t) => (
          <span key={t.name} className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 font-medium shadow-sm ring-1 ring-border">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
            {t.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
