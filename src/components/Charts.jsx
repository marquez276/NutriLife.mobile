import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { c } from "../theme";

const PAD = { l: 34, r: 10, t: 10, b: 24 };

// Linha (com área opcional e linha de meta tracejada). data: [{ label, value }]
export function LineChart({ data, height = 220, color = c.green600, area = false, goal = null, unit = "" }) {
  const [w, setW] = useState(0);
  if (!data.length) return null;
  const valores = data.map(d => d.value).concat(goal != null ? [goal] : []);
  const min = Math.min(...valores), max = Math.max(...valores);
  const span = max - min || 1;
  const lo = min - span * 0.15, hi = max + span * 0.15;
  const iw = Math.max(0, w - PAD.l - PAD.r), ih = height - PAD.t - PAD.b;
  const x = (i) => PAD.l + (data.length === 1 ? iw / 2 : (i * iw) / (data.length - 1));
  const y = (v) => PAD.t + ih - ((v - lo) / (hi - lo)) * ih;
  const linha = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ");
  const areaPath = `${linha} L${x(data.length - 1)},${PAD.t + ih} L${x(0)},${PAD.t + ih} Z`;
  const ticks = [0, 0.5, 1].map(t => lo + (hi - lo) * t);
  const passo = Math.ceil(data.length / 5);

  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ height }}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {ticks.map((t, i) => (
            <G key={i}>
              <Line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke={c.gray100} strokeWidth="1" />
              <SvgText x={PAD.l - 6} y={y(t) + 4} fontSize="10" fill={c.gray400} textAnchor="end">{t.toFixed(1)}</SvgText>
            </G>
          ))}
          {area && data.length > 1 && <Path d={areaPath} fill="url(#g)" />}
          {goal != null && <Line x1={PAD.l} x2={w - PAD.r} y1={y(goal)} y2={y(goal)} stroke={c.amber600} strokeWidth="2" strokeDasharray="6,5" />}
          {data.length > 1 && <Path d={linha} stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />}
          {data.map((d, i) => <Circle key={i} cx={x(i)} cy={y(d.value)} r="5" fill={color} stroke="#fff" strokeWidth="2" />)}
          {data.map((d, i) => (i % passo === 0 || i === data.length - 1) && (
            <SvgText key={`l${i}`} x={x(i)} y={height - 6} fontSize="10" fill={c.gray500} textAnchor="middle">{d.label}</SvgText>
          ))}
        </Svg>
      )}
      {unit ? <Text style={{ position: "absolute", right: 0, top: 0, fontSize: 10, color: c.gray400 }}>{unit}</Text> : null}
    </View>
  );
}

// Barras verticais. data: [{ label, value }]
export function BarChart({ data, height = 220, color = c.green600 }) {
  const [w, setW] = useState(0);
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const iw = Math.max(0, w - PAD.l - PAD.r), ih = height - PAD.t - PAD.b;
  const bw = iw / data.length;
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ height }}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {[0, 0.5, 1].map((t, i) => (
            <G key={i}>
              <Line x1={PAD.l} x2={w - PAD.r} y1={PAD.t + ih - ih * t} y2={PAD.t + ih - ih * t} stroke={c.gray100} />
              <SvgText x={PAD.l - 6} y={PAD.t + ih - ih * t + 4} fontSize="10" fill={c.gray400} textAnchor="end">{Math.round(max * t)}</SvgText>
            </G>
          ))}
          {data.map((d, i) => {
            const bh = (d.value / max) * ih;
            return (
              <G key={i}>
                <Rect x={PAD.l + i * bw + bw * 0.2} y={PAD.t + ih - bh} width={bw * 0.6} height={bh} rx="4" fill={color} />
                <SvgText x={PAD.l + i * bw + bw / 2} y={height - 6} fontSize="10" fill={c.gray500} textAnchor="middle">{d.label}</SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

// Rosca. data: [{ name, value, color }]
export function Donut({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 14, circ = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <Svg width={size} height={size} style={{ alignSelf: "center" }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.gray100} strokeWidth="18" fill="none" />
      {total > 0 && data.map((d, i) => {
        const len = (d.value / total) * circ;
        const el = (
          <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={d.color} strokeWidth="18" fill="none"
            strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acumulado} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
        );
        acumulado += len;
        return el;
      })}
    </Svg>
  );
}
