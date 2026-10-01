// Static aerial map: ocean → port → terminal → yard → rail → river → farmland →
// highway → border plaza → distribution centre. Nothing here moves, so this layer is
// painted once; moving actors live in a separate overlay SVG.
import { INK } from "../palette";
import { Building, GantryTop, LightPole, SignGantry, StackBlock, Tree } from "./pieces";
import { Container3D, Ship3D, Truck3D } from "./vehicles3d";
import {
  BASIN_END,
  BORDER_Y,
  COAST_Y,
  DC,
  GATE_Y,
  HIGHWAY,
  QUAY_X,
  RAMP_1,
  RAMP_2,
  RIVER_Y,
  TRACK,
  TRACK_2_X,
  TRACK_X,
  EXPORT,
  WORLD,
  YARD,
} from "./world";

const L = -400; // scenery extends past the default window for wide screens
const R = 1600;
const SPAN = R - L;
const SANS = { fontFamily: "var(--font-sans)" } as const;

function seeded(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function MapLabel({
  x,
  y,
  children,
  size = 15,
  light = false,
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
  light?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={light ? "#fff" : INK.navy}
      opacity={light ? 0.55 : 0.42}
      fontSize={size}
      fontWeight={800}
      letterSpacing={size * 0.28}
      style={SANS}
    >
      {children}
    </text>
  );
}

function Rails({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 17} y={TRACK.from} width={34} height={TRACK.to - TRACK.from} fill="#b6aea2" />
      <line
        x1={x}
        x2={x}
        y1={TRACK.from}
        y2={TRACK.to}
        stroke="#6f5d4b"
        strokeWidth={26}
        strokeDasharray="5 9"
      />
      <line x1={x - 7} x2={x - 7} y1={TRACK.from} y2={TRACK.to} stroke="#5b6b80" strokeWidth={2.5} />
      <line x1={x + 7} x2={x + 7} y1={TRACK.from} y2={TRACK.to} stroke="#5b6b80" strokeWidth={2.5} />
    </g>
  );
}

function Road({
  x0,
  x1,
  y0,
  y1,
  lanes = [] as number[],
  edge = true,
}: {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  lanes?: number[];
  edge?: boolean;
}) {
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#aw-asphalt)" />
      {edge ? (
        <>
          <line x1={x0 + 4} x2={x0 + 4} y1={y0} y2={y1} stroke="#f1f5f9" strokeWidth={2.5} opacity={0.85} />
          <line x1={x1 - 4} x2={x1 - 4} y1={y0} y2={y1} stroke="#f1f5f9" strokeWidth={2.5} opacity={0.85} />
        </>
      ) : null}
      {lanes.map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={y0}
          y2={y1}
          stroke="#f8fafc"
          strokeWidth={2.5}
          strokeDasharray="26 30"
          opacity={0.8}
        />
      ))}
    </g>
  );
}

function Field({
  x,
  y,
  w,
  h,
  tone,
  angle = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: number;
  angle?: number;
}) {
  const fills = ["url(#aw-field-a)", "url(#aw-field-b)", "url(#aw-field-c)"];
  return (
    <g transform={`rotate(${angle} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={fills[tone % fills.length]} />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.35}
        strokeWidth={3}
      />
    </g>
  );
}

export function AerialGround() {
  const countryside = { from: 3560, to: HIGHWAY.from - 40 };
  return (
    <svg
      viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
      className="block h-auto w-full overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* shared with the actors layer (url refs resolve document-wide) */}
        <filter id="aw-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="aw-cab" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cfd8e3" />
        </linearGradient>
        <linearGradient id="aw-fairing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#e7eef6" />
          <stop offset="1" stopColor="#b9c7d8" />
        </linearGradient>
        <linearGradient id="aw-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1f3d5c" />
          <stop offset="0.45" stopColor="#3f7fa8" />
          <stop offset="0.55" stopColor="#9fd6ea" />
          <stop offset="1" stopColor="#1f3d5c" />
        </linearGradient>
        <linearGradient id="aw-chrome" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b97a8" />
          <stop offset="0.4" stopColor="#f4f7fa" />
          <stop offset="1" stopColor="#7c889a" />
        </linearGradient>
        <linearGradient id="aw-hull" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0f1631" />
          <stop offset="0.12" stopColor="#24325e" />
          <stop offset="0.88" stopColor="#24325e" />
          <stop offset="1" stopColor="#0f1631" />
        </linearGradient>
        <linearGradient id="aw-deck" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7d8ba0" />
          <stop offset="0.5" stopColor="#95a2b5" />
          <stop offset="1" stopColor="#6f7d93" />
        </linearGradient>
        <linearGradient id="aw-loco" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#141d3d" />
          <stop offset="0.35" stopColor="#2a3a6e" />
          <stop offset="1" stopColor="#141d3d" />
        </linearGradient>
        <linearGradient id="aw-box" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id="aw-fan">
          <stop offset="0" stopColor="#4b5d8f" />
          <stop offset="1" stopColor="#1a2347" />
        </radialGradient>
        <pattern id="aw-grille" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#1c2645" />
          <path d="M0,2 H4" stroke="#56689a" strokeWidth="1" />
        </pattern>
        <pattern id="aw-foam" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M4,8 q6,-4 12,0 M22,26 q6,-4 12,0 M10,34 q4,-3 8,0 M28,6 q4,-3 8,0"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </pattern>
        <pattern id="aw-ribs" width="24" height="5" patternUnits="userSpaceOnUse">
          <rect y="2" width="24" height="0.9" fill="#000" fillOpacity="0.13" />
        </pattern>
        <linearGradient id="aw-ocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f9fd" />
          <stop offset="0.12" stopColor="#7fc6e2" />
          <stop offset="0.32" stopColor="#1f86b7" />
          <stop offset="1" stopColor="#0e5f8e" />
        </linearGradient>
        <linearGradient id="aw-basin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0f6796" />
          <stop offset="1" stopColor="#13739f" />
        </linearGradient>
        <pattern id="aw-ripples" width="90" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M8,14 q10,-6 20,0 M50,40 q10,-6 20,0 M70,10 q8,-5 16,0 M20,50 q8,-5 16,0"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.16"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </pattern>
        <linearGradient id="aw-asphalt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a5566" />
          <stop offset="0.5" stopColor="#525e70" />
          <stop offset="1" stopColor="#465163" />
        </linearGradient>
        <pattern id="aw-concrete" width="160" height="160" patternUnits="userSpaceOnUse">
          <rect width="160" height="160" fill="#dfe5ec" />
          <path d="M0,0.5 H160 M0.5,0 V160" stroke="#cdd5df" strokeWidth="1" />
        </pattern>
        <pattern id="aw-field-a" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#b9d3a2" />
          <path d="M0,6 H12" stroke="#a5c48c" strokeWidth="3" />
        </pattern>
        <pattern id="aw-field-b" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#d8d29a" />
          <path d="M6,0 V12" stroke="#c7c085" strokeWidth="3" />
        </pattern>
        <pattern id="aw-field-c" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#a7c79a" />
          <path d="M0,7 H14" stroke="#93b787" strokeWidth="2" />
        </pattern>
        <linearGradient id="aw-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b8fc0" />
          <stop offset="1" stopColor="#1b77a8" />
        </linearGradient>
      </defs>

      {/* ── Ocean (fades in from the hero) ── */}
      <rect x={L} y={0} width={SPAN} height={COAST_Y + 40} fill="url(#aw-ocean)" />
      <rect x={L} y={260} width={SPAN} height={COAST_Y - 220} fill="url(#aw-ripples)" />
      {/* inbound shipping lanes converging on the port */}
      {[-260, 140, 900, 1400].map((x0) => (
        <path
          key={x0}
          d={`M${x0},180 C${x0},900 520,900 520,1500`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.22}
          strokeWidth={3}
          strokeDasharray="2 14"
          strokeLinecap="round"
        />
      ))}
      <MapLabel x={220} y={760} size={18} light>
        GLOBAL ORIGINS
      </MapLabel>

      {/* ── Land ── */}
      <rect x={L} y={COAST_Y} width={SPAN} height={WORLD.height - COAST_Y} fill="url(#aw-concrete)" />
      {/* port basin west of the quay, with a breakwater shore */}
      <rect x={L} y={COAST_Y - 2} width={QUAY_X - L} height={BASIN_END - COAST_Y + 2} fill="url(#aw-basin)" />
      <rect x={L} y={COAST_Y} width={QUAY_X - L} height={BASIN_END - COAST_Y} fill="url(#aw-ripples)" />
      <rect x={L} y={COAST_Y} width={300 - L} height={BASIN_END - COAST_Y + 10} fill="#c9d3a8" />
      <rect x={290} y={COAST_Y} width={14} height={BASIN_END - COAST_Y} fill="#9aa6b6" />
      <path d={`M${L},${BASIN_END} H${QUAY_X} V${BASIN_END + 14} H${L} Z`} fill="#9aa6b6" />
      {/* coastline edge and quay apron */}
      <rect x={QUAY_X} y={COAST_Y - 10} width={R - QUAY_X} height={12} fill="#9aa6b6" />
      <rect x={QUAY_X - 6} y={COAST_Y} width={8} height={BASIN_END - COAST_Y} fill="#e9c46a" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect
          key={i}
          x={QUAY_X - 4}
          y={COAST_Y + 30 + i * 60}
          width={10}
          height={8}
          rx={2}
          fill={INK.navyDark}
        />
      ))}
      <line x1={650} x2={650} y1={COAST_Y} y2={BASIN_END} stroke="#9aa6b6" strokeWidth={4} />
      <line x1={860} x2={860} y1={COAST_Y} y2={BASIN_END} stroke="#9aa6b6" strokeWidth={4} />
      <MapLabel x={760} y={COAST_Y + 70} size={14}>
        PORT TERMINAL
      </MapLabel>
      {/* quay-side stacks and terminal office */}
      <StackBlock x={905} y={1700} cols={9} rows={5} seed={2} />
      <Building x={1170} y={1640} w={150} h={110} height={66}>
        <rect x={1190} y={1660} width={30} height={20} fill="#c9d3df" />
        <rect x={1240} y={1670} width={50} height={14} fill="#c9d3df" />
      </Building>

      {/* ── Terminal road, gate, yard ── */}
      <Road x0={725} x1={855} y0={COAST_Y + 100} y1={TRACK.from + 60} lanes={[790]} />
      <rect x={668} y={GATE_Y - 70} width={40} height={50} rx={3} fill="#f4f7fb" stroke="#c7d2e0" />
      <rect x={872} y={GATE_Y - 70} width={40} height={50} rx={3} fill="#f4f7fb" stroke="#c7d2e0" />
      <line x1={725} x2={855} y1={GATE_Y + 40} y2={GATE_Y + 40} stroke="#f8fafc" strokeWidth={5} />
      <MapLabel x={560} y={YARD.from + 40} size={13}>
        CONTAINER YARD
      </MapLabel>
      <StackBlock x={360} y={YARD.from + 70} cols={7} rows={4} seed={5} />
      <StackBlock x={880} y={YARD.from} cols={10} rows={5} seed={1} />
      {/* rubber-tyred gantries over the stacks */}
      <GantryTop y={YARD.from + 200} x0={350} x1={560} />
      <GantryTop y={YARD.from + 460} x0={870} x1={1160} />

      {/* ── Rail: intermodal ramp → line → inland ramp ── */}
      <Rails x={TRACK_2_X} />
      <Rails x={TRACK_X} />
      <rect x={TRACK_X - 8} y={TRACK.to - 6} width={16} height={12} fill={INK.red} />
      <rect x={TRACK_2_X - 8} y={TRACK.to - 6} width={16} height={12} fill={INK.red} />
      <MapLabel x={420} y={RAMP_1 - 100} size={13}>
        INTERMODAL RAMP
      </MapLabel>
      <ContainerStacks y={RAMP_1 - 150} />

      {/* countryside: fields, trees, local road continues beside the line */}
      <rect
        x={L}
        y={countryside.from}
        width={SPAN}
        height={countryside.to - countryside.from}
        fill="#cfe0c2"
      />
      <Road x0={725} x1={795} y0={TRACK.from + 60} y1={HIGHWAY.from} edge={false} />
      <Rails x={TRACK_X} />
      <Rails x={TRACK_2_X} />
      {Array.from({ length: 14 }, (_, i) => {
        const left = i % 2 === 0;
        const row = Math.floor(i / 2);
        return (
          <Field
            key={i}
            x={left ? L + 30 + (row % 2) * 60 : 840 + (row % 2) * 40}
            y={countryside.from + 40 + row * 230}
            w={left ? 470 - (row % 2) * 60 : 720}
            h={200}
            tone={i}
            angle={left ? -2 : 1.5}
          />
        );
      })}
      {/* highway running south beside the farmland */}
      <Road x0={905} x1={1065} y0={countryside.from} y1={HIGHWAY.from} lanes={[985]} />
      {Array.from({ length: 46 }, (_, i) => {
        const y = countryside.from + 20 + seeded(i) * (countryside.to - countryside.from - 40);
        const x = seeded(i + 99) > 0.5 ? 812 + seeded(i + 7) * 70 : 520 + seeded(i + 3) * 40;
        if (Math.abs(y - RIVER_Y) < 80) return null;
        return <Tree key={i} x={x} y={y} r={10 + seeded(i + 5) * 8} />;
      })}
      <Building x={300} y={4100} w={90} h={70} height={30} roof="#c45b3c" wall="#e8d9c8" />
      <Building x={1120} y={4900} w={110} h={80} height={36} roof="#9a8f80" wall="#d7d0c6" />

      {/* river with rail and road bridges */}
      <path
        d={`M${L},${RIVER_Y - 40} C200,${RIVER_Y - 90} 600,${RIVER_Y + 10} ${R},${RIVER_Y - 50} V${RIVER_Y + 50} C600,${RIVER_Y + 110} 200,${RIVER_Y + 10} ${L},${RIVER_Y + 60} Z`}
        fill="url(#aw-river)"
      />
      {[
        [TRACK_2_X - 40, 120],
        [720, 80],
        [900, 170],
      ].map(([x, w]) => (
        <g key={x}>
          <rect x={x + 8} y={RIVER_Y - 100 + 12} width={w} height={210} fill="#0b1a33" opacity={0.15} />
          <rect x={x} y={RIVER_Y - 100} width={w} height={210} fill="#b9c3d0" />
          <rect x={x} y={RIVER_Y - 100} width={6} height={210} fill="#8a99ad" />
          <rect x={x + w - 6} y={RIVER_Y - 100} width={6} height={210} fill="#8a99ad" />
        </g>
      ))}
      <Rails x={TRACK_X} />
      <Rails x={TRACK_2_X} />
      <Road x0={725} x1={795} y0={RIVER_Y - 100} y1={RIVER_Y + 110} edge={false} />
      <Road x0={905} x1={1065} y0={RIVER_Y - 100} y1={RIVER_Y + 110} lanes={[985]} />

      <MapLabel x={420} y={RAMP_2 - 110} size={13}>
        INLAND RAMP
      </MapLabel>
      <ContainerStacks y={RAMP_2 + 60} />

      {/* ── Highway: OTR / FTL / LTL, border plaza ── */}
      <rect x={L} y={HIGHWAY.from - 40} width={SPAN} height={DC.y - HIGHWAY.from + 40} fill="#d9e4cf" />
      {/* the farmland highway merges into the southbound corridor */}
      <path d={`M905,${HIGHWAY.from - 40} H1065 L915,${HIGHWAY.from + 220} H850 Z`} fill="#4c576a" />
      <Road x0={665} x1={915} y0={HIGHWAY.from} y1={DC.y + 10} lanes={[730, 790, 850]} />
      {Array.from({ length: 30 }, (_, i) => {
        const y = HIGHWAY.from + 30 + seeded(i + 300) * (HIGHWAY.to - HIGHWAY.from - 60);
        const x = seeded(i + 400) > 0.5 ? 950 + seeded(i + 11) * 260 : 400 + seeded(i + 12) * 220;
        if (Math.abs(y - BORDER_Y) < 120) return null;
        return <Tree key={i} x={x} y={y} r={11 + seeded(i + 13) * 9} />;
      })}
      <rect x={640} y={BORDER_Y - 90} width={300} height={180} fill="#e4eaf1" opacity={0.6} />
      {[700, 760, 820, 880].map((x) => (
        <rect
          key={x}
          x={x - 33}
          y={BORDER_Y - 18}
          width={8}
          height={36}
          rx={2}
          fill="#f4f7fb"
          stroke="#b9c5d4"
        />
      ))}

      {/* ── Distribution centre ── */}
      <rect x={L} y={DC.y - 30} width={SPAN} height={WORLD.height - DC.y + 30} fill="url(#aw-concrete)" />
      <Road x0={665} x1={855} y0={DC.y - 30} y1={DC.y + DC.h} />
      <Building x={DC.x} y={DC.y} w={DC.w} h={DC.h} height={54} roof="#eef2f7">
        {Array.from({ length: 5 }, (_, i) => (
          <rect key={i} x={DC.x + 40 + i * 52} y={DC.y + 40} width={30} height={DC.h - 80} fill="#dfe6ee" />
        ))}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={DC.x + 60 + i * 80} y={DC.y + 30} width={26} height={18} rx={2} fill="#c9d3df" />
        ))}
        <text
          x={DC.x + DC.w / 2}
          y={DC.y + DC.h / 2}
          transform={`rotate(-90 ${DC.x + DC.w / 2} ${DC.y + DC.h / 2})`}
          textAnchor="middle"
          dominantBaseline="central"
          fill={INK.navy}
          opacity={0.5}
          fontSize={22}
          fontWeight={800}
          letterSpacing={6}
          style={SANS}
        >
          DISTRIBUTION CENTRE
        </text>
      </Building>
      {/* dock doors on the west wall */}
      {[6920, 6990, 7060, 7130, 7200, 7270].map((y) => (
        <rect
          key={y}
          x={DC.x - 6}
          y={y - 16}
          width={6}
          height={32}
          fill={y === 7060 ? INK.navy : "#8a99ad"}
        />
      ))}
      {/* other carriers already docked (static, turned to face west) */}
      {[6920, 7200].map((y) => (
        <g key={y} transform={`translate(765 ${y}) rotate(90)`}>
          <Truck3D cab="steel" deg={90} load={<Container3D color="#8a99ad" z0={12} deg={90} />} />
        </g>
      ))}

      {/* ── Port-to-port: export terminal (bottom-left) ── */}
      <path
        d={`M${L},${EXPORT.basinY} H${EXPORT.quayX} V${WORLD.height + 40} H${L} Z`}
        fill="url(#aw-basin)"
      />
      <rect
        x={L}
        y={EXPORT.basinY}
        width={EXPORT.quayX - L}
        height={WORLD.height - EXPORT.basinY + 40}
        fill="url(#aw-ripples)"
      />
      <rect
        x={EXPORT.quayX - 6}
        y={EXPORT.basinY}
        width={8}
        height={WORLD.height - EXPORT.basinY + 40}
        fill="#e9c46a"
      />
      <rect x={L} y={EXPORT.basinY - 10} width={EXPORT.quayX - L + 2} height={12} fill="#9aa6b6" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x={EXPORT.quayX - 4}
          y={EXPORT.basinY + 30 + i * 70}
          width={10}
          height={8}
          rx={2}
          fill={INK.navyDark}
        />
      ))}
      {/* branch road: highway west lane → export lane along the quay */}
      <path
        d={`M665,${EXPORT.split} L725,${EXPORT.split} L${EXPORT.laneX + 30},${EXPORT.split + 160} L${EXPORT.laneX + 30},${WORLD.height + 40} L${EXPORT.laneX - 30},${WORLD.height + 40} L${EXPORT.laneX - 30},${EXPORT.split + 160} Z`}
        fill="#4c576a"
      />
      <line
        x1={EXPORT.laneX}
        x2={EXPORT.laneX}
        y1={EXPORT.split + 170}
        y2={WORLD.height}
        stroke="#f8fafc"
        strokeWidth={2.5}
        strokeDasharray="26 30"
        opacity={0.7}
      />
      <MapLabel x={330} y={EXPORT.basinY - 40} size={13}>
        EXPORT TERMINAL
      </MapLabel>
      <g transform={`translate(${EXPORT.shipX} ${EXPORT.shipY})`}>
        <Ship3D heading="up" />
      </g>

      {/* road furniture: lights, lane arrows, exit signs */}
      {Array.from({ length: 6 }, (_, i) => COAST_Y + 200 + i * 260).map((y) => (
        <LightPole key={`t${y}`} x={716} y={y} />
      ))}
      {Array.from({ length: 5 }, (_, i) => HIGHWAY.from + 120 + i * 230).map((y) => (
        <g key={`h${y}`}>
          <LightPole x={655} y={y} />
          <LightPole x={926} y={y} />
        </g>
      ))}
      {[6460, 6500].map((y) => (
        <path
          key={y}
          d={`M700,${y} v-14 M700,${y} l-6,-7 M700,${y} l6,-7`}
          stroke="#f8fafc"
          strokeWidth={3}
          fill="none"
          opacity={0.85}
          transform={`rotate(${y === 6500 ? 30 : 0} 700 ${y})`}
        />
      ))}
      <SignGantry
        y={6380}
        x0={662}
        x1={918}
        signs={[
          { x: 708, text: "EXPORT TERMINAL", sub: "PORT TO PORT ↙" },
          { x: 868, text: "DISTRIBUTION", sub: "DOOR TO DOOR ↓" },
        ]}
      />
    </svg>
  );
}

function ContainerStacks({ y }: { y: number }) {
  return (
    <g>
      <StackBlock x={360} y={y} cols={6} rows={1} seed={3} />
      <StackBlock x={880} y={y} cols={8} rows={1} seed={7} />
    </g>
  );
}
