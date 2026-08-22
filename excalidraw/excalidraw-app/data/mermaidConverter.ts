/**
 * mermaidConverter.ts — Conversor de Código Mermaid a Diagramas Vectoriales Profesionales
 * Soporta diagramas de flujo jerárquicos (TD/LR), secuencias, múltiples formas y etiquetas de arista.
 */

export type MermaidNodeType = "rect" | "rounded" | "stadium" | "diamond" | "cylinder" | "circle";

export interface MermaidNode {
  id: string;
  label: string;
  shape: MermaidNodeType;
}

export interface MermaidConnection {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed" | "thick";
}

export interface MermaidSequenceMessage {
  from: string;
  to: string;
  text: string;
  isDotted?: boolean;
}

export interface MermaidParseResult {
  diagramType: "flowchart" | "sequence" | "unknown";
  direction?: "TD" | "LR" | "RL" | "BT";
  nodes: MermaidNode[];
  connections: MermaidConnection[];
  elements: any[];
}

/**
 * Parsea el texto y extrae el identificador, la etiqueta y la forma del nodo
 */
const parseNodeDef = (raw: string): MermaidNode => {
  const trimmed = raw.trim();

  // 1. Cylinder / Database: [(Database)]
  let match = trimmed.match(/^([A-Za-z0-9_]+)\[\((.*)\)\]$/);
  if (match) {
    return { id: match[1], label: match[2].trim() || match[1], shape: "cylinder" };
  }

  // 2. Stadium / Pill: ([Pill Label])
  match = trimmed.match(/^([A-Za-z0-9_]+)\(\[(.*)\]\)$/);
  if (match) {
    return { id: match[1], label: match[2].trim() || match[1], shape: "stadium" };
  }

  // 3. Circle: ((Circle Label))
  match = trimmed.match(/^([A-Za-z0-9_]+)\(\((.*)\)\)$/);
  if (match) {
    return { id: match[1], label: match[2].trim() || match[1], shape: "circle" };
  }

  // 4. Diamond / Decision: {Decision Label}
  match = trimmed.match(/^([A-Za-z0-9_]+)\{(.*)\}$/);
  if (match) {
    return { id: match[1], label: match[2].trim() || match[1], shape: "diamond" };
  }

  // 5. Rounded: (Rounded Label)
  match = trimmed.match(/^([A-Za-z0-9_]+)\((.*)\)$/);
  if (match) {
    return { id: match[1], label: match[2].trim() || match[1], shape: "rounded" };
  }

  // 6. Rectangle: [Square Label]
  match = trimmed.match(/^([A-Za-z0-9_]+)\[(.*)\]$/);
  if (match) {
    return { id: match[1], label: match[2].trim() || match[1], shape: "rect" };
  }

  // 7. Plain identifier
  const plainId = trimmed.replace(/[^A-Za-z0-9_]/g, "");
  return { id: plainId || trimmed, label: trimmed, shape: "rect" };
};

/**
 * Renderiza Diagramas de Secuencia (sequenceDiagram)
 */
const renderSequenceDiagram = (
  lines: string[],
  startX = 150,
  startY = 150,
): MermaidParseResult => {
  const participantsMap = new Map<string, string>();
  const messages: MermaidSequenceMessage[] = [];

  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("participant ") || line.toLowerCase().startsWith("actor ")) {
      const parts = line.split(/\s+/);
      const id = parts[1];
      const aliasMatch = line.match(/as\s+(.*)$/i);
      const label = aliasMatch ? aliasMatch[1].trim() : id;
      if (id) participantsMap.set(id, label);
    } else if (line.includes("->>") || line.includes("-->>") || line.includes("->") || line.includes("-->")) {
      const isDotted = line.includes("-->>") || line.includes("-->");
      const arrowRegex = /-->>|->>|-->|->/;
      const parts = line.split(arrowRegex);
      if (parts.length >= 2) {
        const from = parts[0].trim();
        const rightPart = parts[1].trim();
        const colonIdx = rightPart.indexOf(":");
        let to = rightPart;
        let text = "";
        if (colonIdx !== -1) {
          to = rightPart.substring(0, colonIdx).trim();
          text = rightPart.substring(colonIdx + 1).trim();
        }

        if (!participantsMap.has(from)) participantsMap.set(from, from);
        if (!participantsMap.has(to)) participantsMap.set(to, to);

        messages.push({ from, to, text, isDotted });
      }
    }
  });

  const participants = Array.from(participantsMap.entries()).map(([id, label]) => ({
    id,
    label,
    shape: "rect" as MermaidNodeType,
  }));

  const elements: any[] = [];
  const partWidth = 140;
  const partHeight = 50;
  const partSpacing = 220;
  const positions = new Map<string, number>();

  const totalLifelineHeight = Math.max(280, messages.length * 70 + 100);

  // Renderizar encabezados de participantes y líneas de vida
  participants.forEach((p, idx) => {
    const px = startX + idx * partSpacing;
    const py = startY;
    const centerX = px + partWidth / 2;
    positions.set(p.id, centerX);

    const rectId = `seq_part_box_${p.id}_${Date.now()}`;
    const textId = `seq_part_txt_${p.id}_${Date.now()}`;

    // Caja superior
    elements.push({
      type: "rectangle",
      id: rectId,
      x: px,
      y: py,
      width: partWidth,
      height: partHeight,
      strokeColor: "#ef4444",
      backgroundColor: "#fef2f2",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      roundness: { type: 3 },
      isDeleted: false,
      updated: Date.now(),
      boundElements: [{ id: textId, type: "text" }],
    });

    // Texto participante
    elements.push({
      type: "text",
      id: textId,
      x: px + 10,
      y: py + 15,
      width: partWidth - 20,
      height: 20,
      text: p.label,
      fontSize: 14,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      containerId: rectId,
      strokeColor: "#1e293b",
      isDeleted: false,
      updated: Date.now(),
    });

    // Línea de vida (Línea punteada vertical)
    elements.push({
      type: "line",
      id: `seq_lifeline_${p.id}_${Date.now()}`,
      x: centerX,
      y: py + partHeight,
      width: 0,
      height: totalLifelineHeight,
      points: [
        [0, 0],
        [0, totalLifelineHeight],
      ],
      strokeColor: "#cbd5e1",
      strokeWidth: 1.5,
      strokeStyle: "dashed",
      roughness: 0,
      isDeleted: false,
      updated: Date.now(),
    });
  });

  // Renderizar flechas de mensajes
  let msgY = startY + partHeight + 40;
  messages.forEach((msg, idx) => {
    const x1 = positions.get(msg.from) || startX;
    const x2 = positions.get(msg.to) || startX;
    const dx = x2 - x1;

    const arrowId = `seq_msg_arrow_${idx}_${Date.now()}`;
    const txtId = `seq_msg_lbl_${idx}_${Date.now()}`;

    elements.push({
      type: "arrow",
      id: arrowId,
      x: x1,
      y: msgY,
      width: Math.abs(dx),
      height: 0,
      points: [
        [0, 0],
        [dx, 0],
      ],
      strokeColor: msg.isDotted ? "#64748b" : "#ef4444",
      strokeWidth: 2,
      strokeStyle: msg.isDotted ? "dashed" : "solid",
      roughness: 0,
      isDeleted: false,
      updated: Date.now(),
      endArrowhead: "arrow",
    });

    if (msg.text) {
      elements.push({
        type: "text",
        id: txtId,
        x: Math.min(x1, x2) + Math.abs(dx) / 2 - 80,
        y: msgY - 20,
        width: 160,
        height: 18,
        text: msg.text,
        fontSize: 12,
        fontFamily: 1,
        textAlign: "center",
        strokeColor: "#0f172a",
        isDeleted: false,
        updated: Date.now(),
      });
    }

    msgY += 60;
  });

  return {
    diagramType: "sequence",
    nodes: participants,
    connections: [],
    elements,
  };
};

/**
 * Parsea y genera Diagramas de Flujo con Layout Jerárquico por Capas
 */
export const convertMermaidToCanvas = (
  mermaidCode: string,
  startX = 150,
  startY = 150,
): MermaidParseResult => {
  const rawLines = mermaidCode
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("%%"));

  if (rawLines.length === 0) {
    return { diagramType: "unknown", nodes: [], connections: [], elements: [] };
  }

  const firstLine = rawLines[0].toLowerCase();
  if (firstLine.includes("sequencediagram")) {
    return renderSequenceDiagram(rawLines.slice(1), startX, startY);
  }

  // Determinar dirección de flujo (TD: Top-Down, LR: Left-Right, etc.)
  let direction: "TD" | "LR" | "RL" | "BT" = "TD";
  if (firstLine.includes(" lr")) direction = "LR";
  else if (firstLine.includes(" rl")) direction = "RL";
  else if (firstLine.includes(" bt")) direction = "BT";

  const nodesMap = new Map<string, MermaidNode>();
  const connections: MermaidConnection[] = [];

  const flowLines = firstLine.startsWith("graph") || firstLine.startsWith("flowchart")
    ? rawLines.slice(1)
    : rawLines;

  flowLines.forEach((line) => {
    if (line.includes("-->") || line.includes("---") || line.includes("==>") || line.includes("-.->")) {
      const tokens = line.split(/(-->|---|==>|-\.->|-->\|[^|]+\||--\s*[^-]+\s*-->)/).map((t) => t.trim()).filter((t) => t.length > 0);

      let currentFromNode: MermaidNode | null = null;
      let currentLabel = "";
      let currentStyle: "solid" | "dashed" | "thick" = "solid";

      tokens.forEach((tok) => {
        if (tok.startsWith("-->|") && tok.endsWith("|")) {
          currentLabel = tok.substring(4, tok.length - 1).trim();
          currentStyle = "solid";
        } else if (tok.startsWith("--") && tok.endsWith("-->")) {
          currentLabel = tok.replace(/^--/, "").replace(/-->$/, "").trim();
          currentStyle = "solid";
        } else if (tok === "-->" || tok === "---") {
          currentLabel = "";
          currentStyle = "solid";
        } else if (tok === "-.->") {
          currentLabel = "";
          currentStyle = "dashed";
        } else if (tok === "==>") {
          currentLabel = "";
          currentStyle = "thick";
        } else {
          const parsed = parseNodeDef(tok);
          nodesMap.set(parsed.id, parsed);

          if (currentFromNode) {
            connections.push({
              from: currentFromNode.id,
              to: parsed.id,
              label: currentLabel || undefined,
              style: currentStyle,
            });
            currentLabel = "";
          }
          currentFromNode = parsed;
        }
      });
    } else {
      const parsed = parseNodeDef(line);
      if (parsed.id) {
        nodesMap.set(parsed.id, parsed);
      }
    }
  });

  const nodes = Array.from(nodesMap.values());
  if (nodes.length === 0) {
    return { diagramType: "flowchart", direction, nodes: [], connections: [], elements: [] };
  }

  // ==========================================
  // Layout Jerárquico (Topological Rank Assignment)
  // ==========================================
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  connections.forEach((c) => {
    if (adj.has(c.from) && inDegree.has(c.to)) {
      adj.get(c.from)?.push(c.to);
      inDegree.set(c.to, (inDegree.get(c.to) || 0) + 1);
    }
  });

  const nodeRanks = new Map<string, number>();
  const queue: { id: string; rank: number }[] = [];

  nodes.forEach((n) => {
    if ((inDegree.get(n.id) || 0) === 0) {
      queue.push({ id: n.id, rank: 0 });
      nodeRanks.set(n.id, 0);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    queue.push({ id: nodes[0].id, rank: 0 });
    nodeRanks.set(nodes[0].id, 0);
  }

  while (queue.length > 0) {
    const { id, rank } = queue.shift()!;
    const neighbors = adj.get(id) || [];
    neighbors.forEach((nbr) => {
      const currentNbrRank = nodeRanks.get(nbr) ?? -1;
      if (rank + 1 > currentNbrRank) {
        nodeRanks.set(nbr, rank + 1);
        queue.push({ id: nbr, rank: rank + 1 });
      }
    });
  }

  nodes.forEach((n, idx) => {
    if (!nodeRanks.has(n.id)) {
      nodeRanks.set(n.id, Math.floor(idx / 3));
    }
  });

  const ranksGroup = new Map<number, MermaidNode[]>();
  nodes.forEach((n) => {
    const r = nodeRanks.get(n.id) || 0;
    if (!ranksGroup.has(r)) ranksGroup.set(r, []);
    ranksGroup.get(r)?.push(n);
  });

  const nodePositions = new Map<string, { x: number; y: number; w: number; h: number }>();
  const elements: any[] = [];
  const baseTime = Date.now();

  const isHorizontal = direction === "LR" || direction === "RL";
  const NODE_W = 170;
  const NODE_H = 65;
  const RANK_SPACING = isHorizontal ? 240 : 160;
  const SIBLING_SPACING = isHorizontal ? 100 : 210;

  const sortedRanks = Array.from(ranksGroup.keys()).sort((a, b) => a - b);
  sortedRanks.forEach((r) => {
    const rankNodes = ranksGroup.get(r) || [];
    const totalSiblingsWidth = (rankNodes.length - 1) * SIBLING_SPACING;

    rankNodes.forEach((node, idx) => {
      let x = startX;
      let y = startY;

      if (isHorizontal) {
        x = startX + r * RANK_SPACING;
        y = startY + idx * SIBLING_SPACING - totalSiblingsWidth / 2 + 150;
      } else {
        x = startX + idx * SIBLING_SPACING - totalSiblingsWidth / 2 + 250;
        y = startY + r * RANK_SPACING;
      }

      nodePositions.set(node.id, { x, y, w: NODE_W, h: NODE_H });

      const rectId = `mermaid_shape_${node.id}_${baseTime}`;
      const textId = `mermaid_text_${node.id}_${baseTime}`;

      let strokeColor = "#ef4444";
      let bgColor = "#fef2f2";
      let roundness: any = { type: 3 };
      let type: any = "rectangle";

      if (node.shape === "diamond") {
        strokeColor = "#d97706";
        bgColor = "#fffbeb";
        roundness = { type: 2 };
      } else if (node.shape === "cylinder") {
        strokeColor = "#0284c7";
        bgColor = "#f0f9ff";
        roundness = { type: 3 };
      } else if (node.shape === "circle") {
        strokeColor = "#16a34a";
        bgColor = "#f0fdf4";
        type = "ellipse";
        roundness = null;
      } else if (node.shape === "stadium") {
        roundness = { type: 3 };
      }

      elements.push({
        type,
        id: rectId,
        x,
        y,
        width: NODE_W,
        height: NODE_H,
        strokeColor,
        backgroundColor: bgColor,
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        roundness,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        isDeleted: false,
        updated: baseTime,
        boundElements: [{ id: textId, type: "text" }],
      });

      elements.push({
        type: "text",
        id: textId,
        x: x + 10,
        y: y + (NODE_H - 22) / 2,
        width: NODE_W - 20,
        height: 22,
        text: node.shape === "cylinder" ? `🗄️ ${node.label}` : node.shape === "diamond" ? `❓ ${node.label}` : node.label,
        fontSize: 13,
        fontFamily: 1,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: rectId,
        strokeColor: "#0f172a",
        isDeleted: false,
        updated: baseTime,
      });
    });
  });

  // Generar Conexiones y Flechas
  connections.forEach((conn, index) => {
    const from = nodePositions.get(conn.from);
    const to = nodePositions.get(conn.to);
    if (!from || !to) return;

    const fromCx = from.x + from.w / 2;
    const fromCy = from.y + from.h / 2;
    const toCx = to.x + to.w / 2;
    const toCy = to.y + to.h / 2;

    const dx = toCx - fromCx;
    const dy = toCy - fromCy;

    let startX_arrow = fromCx;
    let startY_arrow = fromCy;
    let endX_arrow = toCx;
    let endY_arrow = toCy;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        startX_arrow = from.x + from.w;
        endX_arrow = to.x;
      } else {
        startX_arrow = from.x;
        endX_arrow = to.x + to.w;
      }
    } else {
      if (dy > 0) {
        startY_arrow = from.y + from.h;
        endY_arrow = to.y;
      } else {
        startY_arrow = from.y;
        endY_arrow = to.y + to.h;
      }
    }

    const arrowId = `mermaid_arrow_${index}_${baseTime}`;
    elements.push({
      type: "arrow",
      id: arrowId,
      x: startX_arrow,
      y: startY_arrow,
      width: Math.abs(endX_arrow - startX_arrow),
      height: Math.abs(endY_arrow - startY_arrow),
      strokeColor: conn.style === "thick" ? "#ef4444" : "#475569",
      strokeWidth: conn.style === "thick" ? 3 : 2,
      strokeStyle: conn.style === "dashed" ? "dashed" : "solid",
      roughness: 0,
      opacity: 100,
      roundness: { type: 2 },
      points: [
        [0, 0],
        [endX_arrow - startX_arrow, endY_arrow - startY_arrow],
      ],
      endArrowhead: "arrow",
      isDeleted: false,
      updated: baseTime,
    });

    if (conn.label) {
      const midX = (startX_arrow + endX_arrow) / 2;
      const midY = (startY_arrow + endY_arrow) / 2;

      elements.push({
        type: "text",
        id: `mermaid_edge_label_${index}_${baseTime}`,
        x: midX - 30,
        y: midY - 14,
        width: 60,
        height: 18,
        text: conn.label,
        fontSize: 11,
        fontFamily: 1,
        textAlign: "center",
        strokeColor: "#991b1b",
        backgroundColor: "transparent",
        isDeleted: false,
        updated: baseTime,
      });
    }
  });

  return {
    diagramType: "flowchart",
    direction,
    nodes,
    connections,
    elements,
  };
};
