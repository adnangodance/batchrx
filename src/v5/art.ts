/**
 * BatchRx line art — simple, one idea per drawing (200×144 box).
 * Strokes: plain (mint), faint `f`, green highlight `g`, solid sheet `s`.
 */
export type Seg = { d: string; c?: 'f' | 'g' | 's' };
export type Art = { segs: Seg[]; dot?: [number, number] };

const P = (d: string, c?: Seg['c']): Seg => (c ? { d, c } : { d });
const circ = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

/** Files from wholesalers and the PMS merging into one reconciliation. */
export function fanIn(): Art {
  const segs: Seg[] = [];
  for (let i = 0; i < 7; i++) {
    const y = 24 + i * 16;
    segs.push(P(`M30 ${y}C 80 ${y}, 86 72, 120 72`));
  }
  segs.push(P('M120 72H170'));
  return { segs, dot: [120, 72] };
}

/** Inventory: purchased above, billed below — one NDC doesn't balance. */
export function waveform(): Art {
  const segs: Seg[] = [P('M40 72H160', 'f')];
  const H = [16, 26, 34, 22, 30, 38, 20];
  H.forEach((h, i) => {
    const x = 52 + i * 16;
    segs.push(P(`M${x} 66V${66 - h}`));
    segs.push(P(`M${x} 78V${78 + (i === 4 ? h + 18 : h)}`, i === 4 ? 'g' : 'f'));
  });
  return { segs };
}

/** PBM: one pharmacy's claims, split by PBM. */
export function sankey(): Art {
  const segs: Seg[] = [];
  [28, 50, 72, 94, 116].forEach((y, i) => {
    segs.push(P(`M50 72C 100 72, 100 ${y}, 150 ${y}`, i === 0 ? undefined : 'f'));
    segs.push(P(circ(156, y, 3), i === 0 ? 'g' : 'f'));
  });
  return { segs, dot: [50, 72] };
}

/** Billed: a receipt of claims, one highlighted. */
export function ledger(): Art {
  let zig = 'M128 20V122';
  for (let i = 1; i <= 8; i++) zig += `L${128 - i * 7} ${i % 2 ? 116 : 122}`;
  const segs: Seg[] = [P(zig + 'V20Z')];
  [36, 52, 68, 84, 100].forEach((y, i) => {
    segs.push(P(`M84 ${y}H${[104, 98, 106, 96, 102][i]}`, i === 2 ? 'g' : undefined));
    segs.push(P(`M110 ${y}H116`, i === 2 ? 'g' : 'f'));
  });
  return { segs };
}

/** Aberrant: claims follow a line; one sits far outside it. */
export function outlier(): Art {
  const pts: [number, number][] = [
    [50, 112], [60, 106], [68, 108], [76, 98], [86, 96], [94, 88], [102, 90], [110, 80], [120, 78], [128, 70], [138, 68], [146, 60],
  ];
  const segs: Seg[] = [P('M40 24V124H164', 'f')];
  pts.forEach(([x, y]) => segs.push(P(circ(x, y, 1.6))));
  segs.push(P(circ(142, 34, 9), 'g'));
  return { segs, dot: [142, 34] };
}

/** CMS: a shield with a check. */
export function shields(): Art {
  return {
    segs: [P('M100 22L138 36V70C138 96 120 114 100 122C80 114 62 96 62 70V36Z'), P('M86 72l10 10 18-20', 'g')],
  };
}

/** OnSite: the pharmacy cross. */
export function crosses(): Art {
  return { segs: [P('M88 26H112V60H146V84H112V118H88V84H54V60H88Z')], dot: [100, 72] };
}

/** Desktop: the requested documents, checked off. */
export function docs(): Art {
  const segs: Seg[] = [P('M84 22H140V108', 'f'), P('M76 30H132V116', 'f'), P('M68 38H124V124H68Z', 's')];
  [56, 72, 88, 104].forEach((y, i) => {
    if (i < 3) segs.push(P(`M78 ${y}l3 3 6-6`, i === 2 ? 'g' : undefined));
    else segs.push(P(circ(82, y, 3), 'f'));
    segs.push(P(`M94 ${y}H${[114, 110, 116, 108][i]}`, i === 3 ? 'f' : undefined));
  });
  return { segs };
}

/** Investigative: a magnifier over the claims. */
export function lens(): Art {
  const segs: Seg[] = [P(circ(92, 64, 32)), P('M115 87L138 110')];
  for (const dx of [-12, 0, 12])
    for (const dy of [-12, 0, 12]) {
      if (dx === 12 && dy === -12) continue;
      segs.push(P(circ(92 + dx, 64 + dy, 1.8), 'f'));
    }
  return { segs, dot: [104, 52] };
}
