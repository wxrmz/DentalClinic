import { useId } from 'react';
import type { DoctorAvatar } from '../../content/types';
import styles from './index.module.css';

type HairStyle = 'bob' | 'short' | 'bun' | 'crop' | 'long' | 'curly' | 'bald' | 'side' | 'pony' | 'cap';

type Look = {
  bg: [string, string];
  skin: string;
  skinShade: string;
  hair: string;
  hairStyle: HairStyle;
  scrubs: string;
  scrubsShade: string;
  coat?: boolean;
  glasses?: boolean;
  beard?: boolean;
  stethoscope?: boolean;
  badge?: boolean;
  accent?: string;
  steth?: string;
};

const LOOKS: Record<DoctorAvatar, Look> = {
  anna: {
    bg: ['#E3F6EF', '#A9E2CF'],
    skin: '#F5D3BE',
    skinShade: '#E3B49A',
    hair: '#6B3F2A',
    hairStyle: 'bob',
    scrubs: '#2FB592',
    scrubsShade: '#1F9A7B',
    coat: true,
    stethoscope: true,
  },
  igor: {
    bg: ['#E3F2F7', '#A8D8E6'],
    skin: '#EBC3A5',
    skinShade: '#D29F7E',
    hair: '#2B2320',
    hairStyle: 'short',
    scrubs: '#3E8FA6',
    scrubsShade: '#2F7488',
    glasses: true,
    badge: true,
  },
  maria: {
    bg: ['#EDF7E9', '#BFE3B8'],
    skin: '#F3D2B5',
    skinShade: '#DDAF8D',
    hair: '#1E1A1C',
    hairStyle: 'bun',
    scrubs: '#7CCFB6',
    scrubsShade: '#56B497',
    badge: true,
    accent: '#2FB592',
  },
  oleg: {
    bg: ['#E6F4F1', '#9FD6CB'],
    skin: '#D9A47F',
    skinShade: '#BC825C',
    hair: '#5A3B2A',
    hairStyle: 'crop',
    scrubs: '#2F3B40',
    scrubsShade: '#1F2A2E',
    beard: true,
    stethoscope: true,
    steth: '#DDE5E3',
  },
  elena: {
    bg: ['#E6F3F8', '#A9D6E8'],
    skin: '#F6D9C6',
    skinShade: '#E5B79C',
    hair: '#C9A36B',
    hairStyle: 'long',
    scrubs: '#5FB3C9',
    scrubsShade: '#4597AD',
    badge: true,
  },
  dmitry: {
    bg: ['#E3F4EE', '#93D3BF'],
    skin: '#E2AE8B',
    skinShade: '#C68F6C',
    hair: '#3A2A20',
    hairStyle: 'bald',
    scrubs: '#2F7D73',
    scrubsShade: '#22645C',
    glasses: true,
    stethoscope: true,
    steth: '#DDE5E3',
  },
  natalia: {
    bg: ['#F0F7EA', '#C6E6B3'],
    skin: '#F4D4BC',
    skinShade: '#E0B293',
    hair: '#8A4A2E',
    hairStyle: 'pony',
    scrubs: '#6FC4A6',
    scrubsShade: '#4FAA8B',
    badge: true,
    accent: '#1F9A7B',
  },
  artem: {
    bg: ['#E9F4F2', '#A7D9CF'],
    skin: '#EDC5A6',
    skinShade: '#D3A27F',
    hair: '#4A3426',
    hairStyle: 'side',
    scrubs: '#2F3B40',
    scrubsShade: '#1F2A2E',
    coat: true,
  },
  svetlana: {
    bg: ['#EAF6F3', '#B3E2D3'],
    skin: '#C88E68',
    skinShade: '#A9714D',
    hair: '#2E2019',
    hairStyle: 'curly',
    scrubs: '#3FB89A',
    scrubsShade: '#2C9C80',
    stethoscope: true,
  },
  aleksey: {
    bg: ['#E4F1F7', '#9FCFE3'],
    skin: '#F2CDB3',
    skinShade: '#DDAA8B',
    hair: '#5A4030',
    hairStyle: 'cap',
    scrubs: '#3E8FA6',
    scrubsShade: '#2F7488',
    badge: true,
    accent: '#7CCFB6',
  },
  ksenia: {
    bg: ['#EEF7EC', '#B5DDB0'],
    skin: '#F5D6C0',
    skinShade: '#E2B597',
    hair: '#1E1A1C',
    hairStyle: 'bob',
    scrubs: '#8CC59A',
    scrubsShade: '#6AAB7A',
    glasses: true,
  },
  mikhail: {
    bg: ['#E7F2F0', '#A2D2C8'],
    skin: '#EBC0A0',
    skinShade: '#D09D7B',
    hair: '#B9BDB9',
    hairStyle: 'side',
    scrubs: '#3E6F7A',
    scrubsShade: '#2C5560',
    coat: true,
    glasses: true,
    beard: true,
  },
};

const HAIR_BACK: Partial<Record<HairStyle, string>> = {
  bob: 'M126 246C118 168 160 136 200 136C240 136 282 168 274 246C272 292 266 318 252 330C240 326 226 322 214 320L186 320C174 322 160 326 148 330C134 318 128 292 126 246Z',
  long: 'M124 240C116 160 160 132 200 132C240 132 284 160 276 240L286 382C274 394 250 398 238 390L232 318L168 318L162 390C150 398 126 394 114 382Z',
  pony: 'M246 168C296 164 318 222 304 284C298 312 280 312 282 288C290 240 282 206 248 194Z',
};

const HAIR_FRONT: Partial<Record<HairStyle, string>> = {
  bob: 'M130 238C128 178 164 148 204 150C246 152 276 184 270 240C262 214 246 196 222 190C214 206 190 214 162 216C150 220 138 228 130 238Z',
  short:
    'M132 232C128 172 168 146 204 148C244 150 276 178 268 232C262 206 248 192 230 188C210 196 186 198 164 196C150 202 138 214 132 232Z',
  bun: 'M132 240C126 180 164 156 200 156C238 156 274 180 268 240C258 212 238 196 214 194C206 204 196 212 182 214C162 216 144 224 132 240Z',
  pony: 'M132 240C126 180 164 156 200 156C238 156 274 180 268 240C258 212 238 196 214 194C206 204 196 212 182 214C162 216 144 224 132 240Z',
  crop: 'M136 222C136 172 170 152 204 152C240 152 268 172 266 222C256 204 240 196 222 196L180 196C162 198 146 208 136 222Z',
  long: 'M130 240C126 176 164 146 200 146C236 146 274 176 270 240C262 206 236 184 200 182C164 184 138 206 130 240Z',
  side: 'M132 232C128 170 170 144 210 148C250 152 276 182 268 230C262 206 250 192 236 186C220 182 196 190 176 186C160 184 144 204 132 232Z',
};

const CURLS_BACK: [number, number, number][] = [
  [140, 202, 34], [170, 160, 36], [212, 152, 38], [250, 176, 34], [268, 222, 30],
  [132, 248, 28], [270, 262, 26], [148, 292, 24], [254, 296, 24],
];
const CURLS_FRONT: [number, number, number][] = [
  [158, 184, 22], [188, 168, 24], [220, 168, 24], [248, 186, 20],
];

export function ShapeAvatar({
  avatar,
  label,
  face = false,
}: {
  avatar: DoctorAvatar;
  label?: string;
  face?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const l = LOOKS[avatar];
  const ink = '#2A1F1C';
  const accent = l.accent ?? '#2FB592';

  return (
    <svg
      className={face ? styles.avatarFace : styles.avatar}
      viewBox={face ? '106 126 188 188' : '0 0 400 500'}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={l.bg[0]} />
          <stop offset="1" stopColor={l.bg[1]} />
        </linearGradient>
        <radialGradient id={`head${id}`} cx="0.42" cy="0.36" r="0.75">
          <stop offset="0.55" stopColor={l.skin} />
          <stop offset="1" stopColor={l.skinShade} />
        </radialGradient>
        <linearGradient id={`body${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={l.scrubs} />
          <stop offset="1" stopColor={l.scrubsShade} />
        </linearGradient>
      </defs>

      <g data-layer="bg">
        <rect x="-40" y="-40" width="480" height="580" fill={`url(#bg${id})`} />
        {!face && (
          <>
            <circle cx="200" cy="232" r="150" fill="#fff" opacity="0.32" />
            <circle cx="200" cy="232" r="188" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" />
            <g fill="#fff" opacity="0.8">
              <rect x="318" y="78" width="16" height="48" rx="6" />
              <rect x="302" y="94" width="48" height="16" rx="6" />
            </g>
            <g fill="#fff" opacity="0.7">
              <circle cx="72" cy="118" r="7" />
              <circle cx="352" cy="318" r="5" />
              <circle cx="58" cy="362" r="4" />
              <circle cx="96" cy="72" r="3" />
            </g>
          </>
        )}
      </g>

      <g data-layer="figure">
        <g className={styles.figure}>
          {HAIR_BACK[l.hairStyle] && <path d={HAIR_BACK[l.hairStyle]} fill={l.hair} />}
          {l.hairStyle === 'bun' && <circle cx="200" cy="150" r="32" fill={l.hair} />}
          {l.hairStyle === 'curly' && (
            <g fill={l.hair}>
              {CURLS_BACK.map(([cx, cy, r]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
              ))}
            </g>
          )}

          <rect x="172" y="284" width="56" height="108" rx="24" fill={l.skinShade} />
          <g transform="translate(0 -26)">
            <path d="M40 540L40 500C48 414 108 372 200 372C292 372 352 414 360 500L360 540Z" fill={`url(#body${id})`} />
            <path d="M170 372Q200 438 230 372Z" fill={l.skinShade} />
            <path d="M164 374Q200 446 236 374" fill="none" stroke={l.scrubsShade} strokeWidth="6" strokeLinecap="round" />

            {l.coat && (
              <g fill="#fff">
                <path d="M40 540L40 500C46 430 96 386 156 376L196 476L184 540Z" />
                <path d="M360 540L360 500C354 430 304 386 244 376L204 476L216 540Z" />
              </g>
            )}
            {l.stethoscope && (
              <g>
                <path
                  d="M162 382C148 432 168 466 200 468C232 466 252 432 238 382"
                  fill="none"
                  stroke={l.steth ?? '#2B3438'}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="472" r="13" fill="#DDE5E3" stroke={l.steth ? '#9FB0AD' : '#2B3438'} strokeWidth="4" />
              </g>
            )}
            {l.badge && (
              <g>
                <rect x="246" y="428" width="52" height="18" rx="6" fill="#fff" opacity="0.95" />
                <rect x="253" y="435" width="26" height="4" rx="2" fill={accent} />
              </g>
            )}
          </g>

          <circle cx="134" cy="250" r="15" fill={l.skin} />
          <circle cx="266" cy="250" r="15" fill={l.skin} />
          <path d="M131 244Q138 250 133 258" fill="none" stroke={l.skinShade} strokeWidth="3" strokeLinecap="round" />
          <path d="M269 244Q262 250 267 258" fill="none" stroke={l.skinShade} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="200" cy="236" rx="66" ry="74" fill={`url(#head${id})`} />

          {l.hairStyle === 'bald' && (
            <g>
              <ellipse cx="138" cy="226" rx="9" ry="20" fill={l.hair} />
              <ellipse cx="262" cy="226" rx="9" ry="20" fill={l.hair} />
              <ellipse cx="178" cy="184" rx="20" ry="10" fill="#fff" opacity="0.28" transform="rotate(-20 178 184)" />
            </g>
          )}
          {l.hairStyle === 'bun' && <rect x="176" y="168" width="48" height="9" rx="4.5" fill={accent} />}
          {l.hairStyle === 'pony' && (
            <rect x="244" y="176" width="16" height="22" rx="6" fill={accent} transform="rotate(-24 252 187)" />
          )}
          {HAIR_FRONT[l.hairStyle] && <path d={HAIR_FRONT[l.hairStyle]} fill={l.hair} />}
          {l.hairStyle === 'curly' && (
            <g fill={l.hair}>
              {CURLS_FRONT.map(([cx, cy, r]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
              ))}
            </g>
          )}
          {l.hairStyle === 'cap' && (
            <g>
              <path
                d="M128 236C122 166 162 136 200 136C238 136 278 166 272 236C252 222 228 216 200 216C172 216 148 222 128 236Z"
                fill={accent}
              />
              <path
                d="M130 234C150 222 174 216 200 216C226 216 250 222 270 234"
                fill="none"
                stroke="#fff"
                strokeOpacity="0.6"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <g fill="#fff" opacity="0.45">
                <circle cx="170" cy="170" r="4" />
                <circle cx="204" cy="160" r="4" />
                <circle cx="236" cy="174" r="4" />
                <circle cx="186" cy="196" r="4" />
                <circle cx="222" cy="196" r="4" />
              </g>
            </g>
          )}

          <g fill="none" stroke={l.hair} strokeWidth="5" strokeLinecap="round">
            <path d="M164 230Q177 223 190 229" />
            <path d="M210 229Q223 223 236 230" />
          </g>
          <g fill={ink}>
            <ellipse cx="178" cy="250" rx="5.5" ry="7" />
            <ellipse cx="222" cy="250" rx="5.5" ry="7" />
          </g>
          <g fill="#fff">
            <circle cx="180" cy="247" r="1.8" />
            <circle cx="224" cy="247" r="1.8" />
          </g>
          <path d="M200 258Q206 270 198 274" fill="none" stroke={l.skinShade} strokeWidth="3.5" strokeLinecap="round" />
          <g fill="#F08A7E" opacity="0.22">
            <circle cx="160" cy="276" r="11" />
            <circle cx="240" cy="276" r="11" />
          </g>

          {l.beard && (
            <path
              d="M134 232C132 286 152 326 200 342C248 326 268 286 266 232L256 236C256 266 246 290 228 300C220 292 180 292 172 300C154 290 144 266 144 236Z"
              fill={l.hair}
            />
          )}
          <path d="M182 284Q200 304 218 284Z" fill="#fff" stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
          {l.beard && (
            <path
              d="M176 283C182 272 194 270 200 277C206 270 218 272 224 283C216 288 206 287 200 283C194 287 184 288 176 283Z"
              fill={l.hair}
            />
          )}

          {l.glasses && (
            <g fill="rgba(255,255,255,0.18)" stroke="#1F2A2E" strokeWidth="4">
              <circle cx="178" cy="250" r="18" />
              <circle cx="222" cy="250" r="18" />
              <path d="M196 248Q200 244 204 248" fill="none" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
