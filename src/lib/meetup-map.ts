import { width as W, height as H, pins } from "../data/meetup-map.json";
export type MapBox = { x: number; y: number; width: number; height: number };

/** The box that shows everything. */
export const WHOLE_MAP: MapBox = { x: 0, y: 0, width: W, height: H };

/** The box around a set of points, with room to breathe and never so
 *  small that a dot would be huge. */
export function boxAround(points: { x: number; y: number }[]): MapBox {
  if (points.length === 0) return WHOLE_MAP;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const pad = 40;
  let x0 = Math.min(...xs) - pad;
  let x1 = Math.max(...xs) + pad;
  let y0 = Math.min(...ys) - pad;
  let y1 = Math.max(...ys) + pad;
  const minW = W / 4;
  const minH = H / 4;
  if (x1 - x0 < minW) {
    const c = (x0 + x1) / 2;
    x0 = c - minW / 2;
    x1 = c + minW / 2;
  }
  if (y1 - y0 < minH) {
    const c = (y0 + y1) / 2;
    y0 = c - minH / 2;
    y1 = c + minH / 2;
  }
  const ratio = W / H;
  if ((x1 - x0) / (y1 - y0) > ratio) {
    const h = (x1 - x0) / ratio;
    const c = (y0 + y1) / 2;
    y0 = c - h / 2;
    y1 = c + h / 2;
  } else {
    const w = (y1 - y0) * ratio;
    const c = (x0 + x1) / 2;
    x0 = c - w / 2;
    x1 = c + w / 2;
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** Where the pins are on the map, by meetup. */
export const PIN_AT = new Map(pins.map((p) => [p.id, p]));
