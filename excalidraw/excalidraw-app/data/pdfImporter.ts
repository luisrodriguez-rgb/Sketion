/**
 * PDF Importer Utility for My-Excalidraw
 * Client-side PDF rendering & page conversion to Excalidraw Image elements
 */

import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

export interface PDFImportProgress {
  currentPage: number;
  totalPages: number;
}

/**
 * Loads a PDF file and converts its pages into images on the canvas
 */
export const importPDFToCanvas = async (
  file: File,
  onProgress?: (progress: PDFImportProgress) => void,
): Promise<{
  images: { id: string; dataURL: string; mimeType: string; width: number; height: number; blob: Blob }[];
  elements: any[];
}> => {
  // Dynamically load pdfjs from CDN
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  const images: { id: string; dataURL: string; mimeType: string; width: number; height: number; blob: Blob }[] = [];
  const elements: any[] = [];

  let currentY = 100;
  const PAGE_SPACING = 40;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({ currentPage: i, totalPages });
    }

    const page = await pdf.getPage(i);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    // Calculate adaptive scale to cap width at 1200px for crystal-clear HD & ultra-light memory footprint
    const MAX_WIDTH = 1200;
    const targetScale = unscaledViewport.width > MAX_WIDTH ? MAX_WIDTH / unscaledViewport.width : 1.5;
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background explicitly to prevent transparent background
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, viewport.width, viewport.height);

    // Use page rendering with promise
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // OPTIMIZACIÓN: Generar Blob local en lugar de DataURL Base64 gigante
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.75);
    });

    // Liberar explícitamente el buffer del canvas 2D
    canvas.width = 0;
    canvas.height = 0;

    if (!blob) continue;

    const dataURL = URL.createObjectURL(blob);
    const fileId = `pdf_page_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`;

    // Extracción de Texto usando PDF.js
    const textContent = await page.getTextContent();

    images.push({
      id: fileId,
      dataURL,
      mimeType: "image/jpeg",
      width: viewport.width,
      height: viewport.height,
      blob,
    });

    // Create an Excalidraw Image Element for this page
    const imageElement = {
      type: "image",
      fileId,
      status: "saved",
      x: 100,
      y: currentY,
      width: viewport.width,
      height: viewport.height,
      strokeColor: "transparent",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
      customData: {
        pdfName: file.name,
        pageIndex: i,
        totalPages,
        viewBox: unscaledViewport.viewBox,
        scale: targetScale,
        rotation: unscaledViewport.rotation,
        textContent,
      },
    };

    elements.push(imageElement);
    currentY += viewport.height + PAGE_SPACING;

    // Yield control to the browser main thread to avoid freezing/lagging the UI
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return { images, elements };
};

/**
 * Helper to dynamically load pdfjs library if not present
 */
export const loadPdfJs = async (): Promise<any> => {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      resolve(pdfjs);
    };
    script.onerror = () => {
      // Fallback to cdnjs if unpkg fails
      const fallbackScript = document.createElement("script");
      fallbackScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      fallbackScript.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjs);
      };
      fallbackScript.onerror = () => reject(new Error("No se pudo cargar la librería PDF.js"));
      document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(script);
  });
};
