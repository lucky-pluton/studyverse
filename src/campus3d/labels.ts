import * as THREE from 'three';
import type { Place } from './landmarks';
import { CATEGORY_COLOR } from './landmarks';

/** off: only study spots; key: landmarks and named places; all: every building on campus too */
export type LabelMode = 'off' | 'key' | 'all';

interface Item {
  place: Place;
  el: HTMLElement;
  pri: number;
  w: number;
  h: number;
  shown: boolean;
  cnt?: HTMLElement;
}

/** place names drawn as small white tags with a pointer down to the building */
const TAGGED = new Set<Place['kind']>(['major', 'hostel', 'area', 'building', 'minor', 'poi']);

const PRI: Record<Place['kind'], number> = { study: 100, major: 80, soon: 70, district: 60, hostel: 50, area: 40, building: 35, road: 30, minor: 20, poi: 15 };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class LabelLayer {
  private items: Item[] = [];
  private v = new THREE.Vector3();
  private selected: string | null = null;
  mode: LabelMode = 'all';
  /** show only this category on the map (study spots always show); null shows every kind */
  filter: string | null = null;
  get enabled(): boolean { return this.mode !== 'off'; }
  /** screen boxes of the page's panels, flat [x0, y0, x1, y1, …]; labels don't go under them */
  private obstacles: number[] = [];
  setObstacles(boxes: number[]): void { this.obstacles = boxes; }

  constructor(root: HTMLElement, places: Place[], onClick: (p: Place) => void) {
    for (const p of places) {
      if (p.kind === 'poi' && p.id === 'gc-name') continue;
      const interactive = p.kind !== 'district' && p.kind !== 'road';
      const el = document.createElement(interactive ? 'button' : 'div');
      el.className = 'lbl k-' + p.kind + (TAGGED.has(p.kind) ? ' tg' : '') + (p.outside ? ' out' : '');
      let cnt: HTMLElement | undefined;
      if (p.kind === 'study') {
        el.innerHTML = `<span class="ic" aria-hidden="true">${p.icon || '📍'}</span><span class="nm">${esc(p.name)}</span><span class="cnt" hidden></span>`;
        cnt = el.querySelector('.cnt') as HTMLElement;
      } else if (p.kind === 'soon') {
        el.innerHTML = `<span class="nm">${esc(p.name)}</span><span class="soon">${esc(p.badge || 'Soon')}</span>`;
      } else if (p.kind === 'district' || p.kind === 'road') {
        el.textContent = p.name;
      } else {
        el.innerHTML = `<i class="dot" aria-hidden="true"></i><span class="nm">${esc(p.name)}</span>`;
        if (p.cat && CATEGORY_COLOR[p.cat]) (el.querySelector('.dot') as HTMLElement).style.setProperty('--c', CATEGORY_COLOR[p.cat]);
      }
      if (interactive) {
        (el as HTMLButtonElement).type = 'button';
        el.tabIndex = -1;
        el.addEventListener('click', (e) => { e.stopPropagation(); onClick(p); });
      }
      el.style.display = 'none';
      root.appendChild(el);
      this.items.push({ place: p, el, pri: PRI[p.kind], w: 0, h: 0, shown: false, cnt });
    }
    this.items.sort((a, b) => b.pri - a.pri);
  }

  setCounts(counts: Record<string, number>): void {
    for (const it of this.items) {
      if (!it.cnt || !it.place.studyId) continue;
      const n = counts[it.place.studyId] || 0;
      it.cnt.hidden = n <= 0;
      it.cnt.textContent = String(n);
      it.cnt.title = n + (n === 1 ? ' student studying' : ' students studying');
      it.w = 0; // re-measure
    }
  }

  setSelected(id: string | null): void {
    this.selected = id;
    for (const it of this.items) it.el.classList.toggle('sel', it.place.id === id);
  }

  private visibleAt(p: Place, viewDist: number, near: number): boolean {
    switch (p.kind) {
      case 'study': return true;
      case 'major': return viewDist < 2800;
      case 'soon': return viewDist < 2400;
      case 'district': return viewDist > 650;
      case 'hostel': return viewDist < 1300 && near < 1200;
      case 'road': return viewDist < 850 && viewDist > 120 && near < 800;
      case 'area': return viewDist < 1100 && near < 900;
      case 'building': return p.outside ? viewDist < 420 && near < 420 : this.mode === 'all' ? viewDist < 900 && near < 800 : viewDist < 640 && near < 600;
      case 'minor': return this.mode === 'all' && viewDist < 560 && near < 480;
      case 'poi': return viewDist < 300 && near < 280;
    }
  }

  update(camera: THREE.PerspectiveCamera, width: number, height: number, viewDist: number, target: THREE.Vector3): void {
    // far out, study pills shrink to their icon and live count
    const compact = viewDist > 1700;
    if (compact !== this.compact) {
      this.compact = compact;
      for (const it of this.items) if (it.place.kind === 'study') { it.el.classList.toggle('compact', compact); it.w = 0; }
    }
    const placed: number[] = this.obstacles.slice();
    const sel = this.items.find((it) => it.place.id === this.selected);
    if (sel) this.place(sel, true, camera, width, height, viewDist, target, placed);
    for (const it of this.items) if (it !== sel) this.place(it, false, camera, width, height, viewDist, target, placed);
  }

  private compact = false;

  private place(it: Item, isSel: boolean, camera: THREE.PerspectiveCamera, width: number, height: number, viewDist: number, target: THREE.Vector3, placed: number[]): void {
    const p = it.place;
    // a chosen category shows even when labels are switched off
    let show = this.enabled || isSel || p.kind === 'study' || (this.filter !== null && p.cat === this.filter);
    if (show && !isSel && this.filter && p.kind !== 'study') {
      // one category at a time: it shows from further out, everything else steps aside
      show = p.cat === this.filter && viewDist < 3200;
    } else if (show && !isSel) show = this.visibleAt(p, viewDist, Math.hypot(p.x - target.x, p.z - target.z));
    let sx = 0, sy = 0;
    if (show) {
      this.v.set(p.x, p.h + 3, p.z).project(camera);
      if (this.v.z > 1 || this.v.x < -1.15 || this.v.x > 1.15 || this.v.y < -1.15 || this.v.y > 1.15) show = false;
      sx = (this.v.x * 0.5 + 0.5) * width;
      sy = (-this.v.y * 0.5 + 0.5) * height;
    }
    if (show) {
      if (!it.shown) { it.el.style.display = ''; it.shown = true; }
      if (!it.w) { it.w = it.el.offsetWidth || 80; it.h = it.el.offsetHeight || 20; }
      // tags and study pills sit a little above their anchor, on a pointer
      const lift = p.kind === 'study' || TAGGED.has(p.kind) ? 10 : 0;
      const x0 = sx - it.w / 2 - 3, y0 = sy - it.h - 3 - lift, x1 = sx + it.w / 2 + 3, y1 = sy + 3;
      // a name cut off by the screen edge reads worse than no name
      if (!isSel && (x0 < 2 || x1 > width - 2)) show = false;
      if (show && !isSel) {
        for (let i = 0; i < placed.length; i += 4) {
          if (x0 < placed[i + 2] && x1 > placed[i] && y0 < placed[i + 3] && y1 > placed[i + 1]) { show = false; break; }
        }
      }
      if (show) {
        placed.push(x0, y0, x1, y1);
        it.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
        it.el.style.zIndex = String(isSel ? 999 : it.pri);
      }
    }
    if (!show && it.shown) { it.el.style.display = 'none'; it.shown = false; }
  }
}
