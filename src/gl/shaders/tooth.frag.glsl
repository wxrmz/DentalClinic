precision highp float;
uniform vec2 R;
uniform vec2 M;
uniform float T;

float smin(float a, float b, float k) {
  float h = clamp(.5 + .5 * (b - a) / k, 0., 1.);
  return mix(b, a, h) - k * h * (1. - h);
}
float smax(float a, float b, float k) { return -smin(-a, -b, k); }

float sdE(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.) / k1;
}

float sdRC(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a;
  float l2 = dot(ba, ba);
  float rr = r1 - r2;
  float a2 = l2 - rr * rr;
  float il2 = 1. / l2;
  vec3 pa = p - a;
  float y = dot(pa, ba);
  float z = y - l2;
  vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv);
  float y2 = y * y * l2;
  float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float map(vec3 p) {
  p.y -= .1;
  float bc = length(p - vec3(0., .2, 0.)) - .95;
  float br = length(p - vec3(0., -.66, .05)) - .9;
  if (min(bc, br) > .25) return min(bc, br) - .05;
  float d = sdE(p - vec3(0., .28, 0.), vec3(.66, .40, .58));
  d = smin(d, length(p - vec3(.30, .56, .26)) - .22, .16);
  d = smin(d, length(p - vec3(-.30, .56, .26)) - .22, .16);
  d = smin(d, length(p - vec3(.30, .54, -.26)) - .21, .16);
  d = smin(d, length(p - vec3(-.30, .54, -.26)) - .21, .16);
  d = smax(d, -(length(p - vec3(0., .82, 0.)) - .2), .12);
  d = smin(d, sdE(p - vec3(0., -.08, 0.), vec3(.52, .32, .47)), .18);
  float r = sdRC(p, vec3(.26, -.18, -.06), vec3(.36, -1.15, -.02), .26, .09);
  r = smin(r, sdRC(p, vec3(-.26, -.18, -.06), vec3(-.33, -1.12, -.06), .26, .09), .05);
  r = smin(r, sdRC(p, vec3(0., -.18, .2), vec3(.02, -1.0, .36), .22, .08), .06);
  return smin(d, r, .16);
}

vec3 nor(vec3 p) {
  vec2 e = vec2(.0015, -.0015);
  return normalize(
    e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)
  );
}

vec3 shade(vec3 p, vec3 rd, float ax, float ay) {
  vec3 n = nor(p);
  vec3 v = -rd;
  vec3 L = normalize(vec3(.6, .8, .7));
  L.yz *= rot(ax);
  L.xz *= rot(ay);
  vec3 L2 = normalize(vec3(-.7, .1, -.4));
  L2.yz *= rot(ax);
  L2.xz *= rot(ay);
  float wrap = clamp((dot(n, L) + .5) / 1.5, 0., 1.);
  float fre = pow(1. - clamp(dot(n, v), 0., 1.), 3.);
  vec3 h = normalize(L + v);
  float ao = clamp(map(p + n * .12) / .12, 0., 1.) * .5 + .5;
  vec3 base = vec3(.97, .975, .965);
  float nh = clamp(dot(n, h), 0., 1.);
  vec3 col = base * (.42 + .62 * wrap) * ao
    + vec3(.18, .72, .57) * fre * .55
    + vec3(1.) * pow(nh, 90.) * 1.1
    + vec3(1.) * pow(nh, 12.) * .18;
  col += vec3(.75, .9, .86) * clamp(dot(n, L2), 0., 1.) * .18;
  return pow(col, vec3(.95));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * R) / R.y;
  uv *= rot(-.2);
  vec3 ro = vec3(0., 0., 5.3);
  vec3 rd = normalize(vec3(uv, -1.75));
  float ay = -.6 + M.x * .6 + sin(T * .45) * .28;
  float ax = .38 + M.y * .45 + sin(T * .31) * .06;
  ro.yz *= rot(ax);
  rd.yz *= rot(ax);
  ro.xz *= rot(ay);
  rd.xz *= rot(ay);

  vec3 bmin = vec3(-.8, -1.25, -.72);
  vec3 bmax = vec3(.8, 1.0, .72);
  vec3 ird = 1. / rd;
  vec3 t0 = (bmin - ro) * ird;
  vec3 t1 = (bmax - ro) * ird;
  vec3 tn = min(t0, t1);
  vec3 tf = max(t0, t1);
  float t = max(max(tn.x, tn.y), max(tn.z, 0.));
  float tEnd = min(min(tf.x, tf.y), tf.z);
  if (t >= tEnd) {
    gl_FragColor = vec4(0.);
    return;
  }

  float pk = 1.5 / (R.y * 1.75);
  float qMin = 1e5;
  float tq = t;
  float hit = 0.;
  for (int i = 0; i < 72; i++) {
    float h = map(ro + rd * t);
    if (h < max(.0008, pk * t * .3)) {
      hit = 1.;
      break;
    }
    float q = h / (pk * t);
    if (q < qMin) {
      qMin = q;
      tq = t;
    }
    t += h;
    if (t > tEnd) break;
  }

  if (hit > .5) {
    gl_FragColor = vec4(shade(ro + rd * t, rd, ax, ay), 1.);
    return;
  }
  float a = 1. - smoothstep(0., 1., qMin);
  if (a <= 0.) {
    gl_FragColor = vec4(0.);
    return;
  }
  gl_FragColor = vec4(shade(ro + rd * tq, rd, ax, ay) * a, a);
}
