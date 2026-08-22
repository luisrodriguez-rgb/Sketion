import React, { useRef, useEffect, useMemo } from "react";
import { loadPdfJs } from "../data/pdfImporter";

interface PDFTextLayersOverlayProps {
  elements: readonly any[];
  appState: any;
  updateRef: React.MutableRefObject<((appState: any) => void) | null>;
}

export const PDFTextLayersOverlay: React.FC<PDFTextLayersOverlayProps> = ({
  elements,
  appState,
  updateRef,
}) => {
  const pdfPages = useMemo(() => {
    return elements.filter(
      (el) => !el.isDeleted && el.type === "image" && el.customData?.textContent
    );
  }, [elements]);

  useEffect(() => {
    const updatePositions = (currentAppState: any) => {
      const zoom = currentAppState.zoom.value;
      const scrollX = currentAppState.scrollX;
      const scrollY = currentAppState.scrollY;

      pdfPages.forEach((page) => {
        const domEl = document.getElementById(`pdf-text-layer-${page.id}`);
        if (domEl) {
          const x = page.x * zoom + scrollX;
          const y = page.y * zoom + scrollY;
          domEl.style.left = `${x}px`;
          domEl.style.top = `${y}px`;
          domEl.style.transform = `scale(${zoom})`;
        }
      });
    };

    // Sync initial positions immediately on state/element updates
    updatePositions(appState);

    updateRef.current = updatePositions;
    return () => {
      updateRef.current = null;
    };
  }, [pdfPages, appState, updateRef]);

  return (
    <div
      className="pdf-text-layers-overlay"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 2, // Above canvas, below menus/modals
      }}
    >
      {pdfPages.map((page) => (
        <PDFPageTextLayer key={page.id} element={page} appState={appState} />
      ))}
    </div>
  );
};

interface PDFPageTextLayerProps {
  element: any;
  appState: any;
}

const PDFPageTextLayer: React.FC<PDFPageTextLayerProps> = ({
  element,
  appState,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef<string | null>(null);

  const { viewBox, scale, rotation, textContent } = element.customData || {};

  useEffect(() => {
    let active = true;

    const renderText = async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (!active) return;

        const container = containerRef.current;
        if (!container || !textContent || !viewBox) return;

        const renderId = `${element.id}_${element.updated}`;
        if (renderedRef.current === renderId) return;
        renderedRef.current = renderId;

        // Limpiar elementos anteriores
        container.innerHTML = "";

        let viewport: any = null;
        if (typeof pdfjs.PageViewport === "function") {
          viewport = new pdfjs.PageViewport({
            viewBox,
            scale: scale || 1,
            rotation: rotation || 0,
          });
        } else {
          viewport = {
            width: element.width,
            height: element.height,
            scale: scale || 1,
            rotation: rotation || 0,
            viewBox,
            transform: [scale || 1, 0, 0, -(scale || 1), 0, element.height],
          };
        }

        if (typeof pdfjs.renderTextLayer === "function") {
          await pdfjs.renderTextLayer({
            textContent,
            container,
            viewport,
            textDivs: [],
          }).promise;
        } else if (typeof pdfjs.TextLayer === "function") {
          const textLayer = new pdfjs.TextLayer({
            container,
            textContentSource: textContent,
            viewport,
          });
          await textLayer.render();
        }
      } catch (_err) {
        // Silenciar errores menores de selección de texto para mantener el canvas limpio
      }
    };

    renderText();

    return () => {
      active = false;
    };
  }, [element.id, element.updated, viewBox, scale, rotation, textContent]);

  const zoom = appState.zoom.value;
  const x = element.x * zoom + appState.scrollX;
  const y = element.y * zoom + appState.scrollY;

  return (
    <div
      id={`pdf-text-layer-${element.id}`}
      ref={containerRef}
      className="textLayer pdf-text-layer"
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `scale(${zoom})`,
        transformOrigin: "0 0",
        pointerEvents: "auto",
      }}
    />
  );
};
