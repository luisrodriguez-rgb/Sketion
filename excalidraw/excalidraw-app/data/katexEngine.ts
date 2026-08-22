/**
 * katexEngine.ts — Motor de LaTeX Científico y Matemático para My-Excalidraw
 * Compila expresiones matemáticas complejas a vectores SVG de alta definición listos para el canvas.
 */

export interface LaTeXPreset {
  id: string;
  category: "Machine Learning & IA" | "Cálculo" | "Álgebra Lineal" | "Estadística" | "Optimización" | "Física Teórica";
  name: string;
  latex: string;
}

export const LATEX_PRESETS: LaTeXPreset[] = [
  // MACHINE LEARNING & IA
  {
    id: "transformer_attention",
    category: "Machine Learning & IA",
    name: "Scaled Dot-Product Attention (Transformers)",
    latex: "\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V",
  },
  {
    id: "cross_entropy_loss",
    category: "Machine Learning & IA",
    name: "Cross-Entropy Loss Multiclase",
    latex: "\\mathcal{L}_{CE} = -\\sum_{c=1}^C y_c \\log(\\hat{y}_c)",
  },
  {
    id: "backpropagation",
    category: "Machine Learning & IA",
    name: "Gradiente de Red Neuronal (Backprop)",
    latex: "\\frac{\\partial \\mathcal{L}}{\\partial W^{[l]}} = \\frac{\\partial \\mathcal{L}}{\\partial Z^{[l]}} \\cdot (A^{[l-1]})^T",
  },
  {
    id: "gradient_descent_adam",
    category: "Machine Learning & IA",
    name: "Actualización de Parámetros Adam",
    latex: "\\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{\\hat{v}_t} + \\epsilon} \\hat{m}_t",
  },

  // CÁLCULO
  {
    id: "integral_definida",
    category: "Cálculo",
    name: "Teorema Fundamental del Cálculo",
    latex: "\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)",
  },
  {
    id: "derivada_parcial",
    category: "Cálculo",
    name: "Definición de Derivada Parcial",
    latex: "\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h, y) - f(x,y)}{h}",
  },
  {
    id: "serie_taylor",
    category: "Cálculo",
    name: "Serie de Taylor Multivariable",
    latex: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n",
  },
  {
    id: "teorema_stokes",
    category: "Cálculo",
    name: "Teorema de Stokes",
    latex: "\\oint_{\\partial \\Sigma} \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_{\\Sigma} (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}",
  },

  // ÁLGEBRA LINEAL
  {
    id: "matriz_2x2",
    category: "Álgebra Lineal",
    name: "Descomposición en Valores Propios",
    latex: "A \\mathbf{v} = \\lambda \\mathbf{v} \\implies \\det(A - \\lambda I) = 0",
  },
  {
    id: "svd_decomposition",
    category: "Álgebra Lineal",
    name: "Descomposición SVD",
    latex: "A = U \\Sigma V^T",
  },
  {
    id: "sistema_lineal",
    category: "Álgebra Lineal",
    name: "Sistema Matricial Ax = b",
    latex: "\\begin{bmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{bmatrix} \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} b_1 \\\\ b_2 \\end{bmatrix}",
  },

  // ESTADÍSTICA
  {
    id: "distribucion_normal",
    category: "Estadística",
    name: "Distribución Normal Gaussiana",
    latex: "f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
  },
  {
    id: "bayes",
    category: "Estadística",
    name: "Teorema de Bayes",
    latex: "P(A \\mid B) = \\frac{P(B \\mid A) \\, P(A)}{P(B)}",
  },
  {
    id: "kl_divergence",
    category: "Estadística",
    name: "Divergencia Kullback-Leibler",
    latex: "D_{KL}(P \\parallel Q) = \\sum_{x} P(x) \\log\\left(\\frac{P(x)}{Q(x)}\\right)",
  },

  // OPTIMIZACIÓN
  {
    id: "programacion_lineal",
    category: "Optimización",
    name: "Modelo Canónico de Programación Lineal",
    latex: "\\max \\; Z = \\mathbf{c}^T \\mathbf{x} \\quad \\text{s.a.} \\quad A \\mathbf{x} \\le \\mathbf{b}, \\quad \\mathbf{x} \\ge \\mathbf{0}",
  },
  {
    id: "condiciones_kkt",
    category: "Optimización",
    name: "Condiciones de Karush-Kuhn-Tucker (KKT)",
    latex: "\\nabla f(x^*) + \\sum_{i=1}^m \\lambda_i \\nabla g_i(x^*) + \\sum_{j=1}^p \\mu_j \\nabla h_j(x^*) = 0",
  },
  {
    id: "bellman_equation",
    category: "Optimización",
    name: "Ecuación de Optimalidad de Bellman (RL)",
    latex: "V(s) = \\max_{a} \\left( R(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a) V(s') \\right)",
  },

  // FÍSICA TEÓRICA
  {
    id: "schrodinger",
    category: "Física Teórica",
    name: "Ecuación de Schrödinger Dependiente del Tiempo",
    latex: "i \\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)",
  },
  {
    id: "euler_lagrange",
    category: "Física Teórica",
    name: "Ecuaciones de Euler-Lagrange",
    latex: "\\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial \\dot{q}_i} \\right) - \\frac{\\partial L}{\\partial q_i} = 0",
  },
];

/**
 * Carga dinámica de MathJax v3 para compilación TeX -> SVG
 */
const loadMathJax = async (): Promise<any> => {
  if ((window as any).MathJax && (window as any).MathJax.tex2svg) {
    return (window as any).MathJax;
  }
  return new Promise((resolve, reject) => {
    (window as any).MathJax = {
      tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]],
        packages: ["base", "ams", "noerrors", "noundefined"],
      },
      svg: {
        fontCache: "global",
      },
      startup: {
        ready: () => {
          (window as any).MathJax.startup.defaultReady();
          resolve((window as any).MathJax);
        },
      },
    };
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).MathJax?.tex2svg) {
        resolve((window as any).MathJax);
      }
    };
    script.onerror = () => reject(new Error("No se pudo conectar con el motor de compilación LaTeX"));
    document.head.appendChild(script);
  });
};

/**
 * Renderiza una ecuación LaTeX a un string SVG vectorial con dimensiones exactas
 */
export const renderLaTeXToSVG = async (
  latex: string,
): Promise<{ svgString: string; width: number; height: number }> => {
  const mathjax = await loadMathJax();
  const cleanLaTeX = latex.trim();
  const container = mathjax.tex2svg(cleanLaTeX, { display: true });
  const svgElement = container.querySelector("svg");
  if (!svgElement) {
    throw new Error("No se pudo compilar la fórmula a formato vectorial SVG");
  }

  const widthAttr = svgElement.getAttribute("width");
  const heightAttr = svgElement.getAttribute("height");

  const widthEx = parseFloat(widthAttr || "14");
  const heightEx = parseFloat(heightAttr || "3");

  // Escalar proporcionalmente ex a píxeles nítidos
  const width = Math.max(140, Math.round(widthEx * 10.5));
  const height = Math.max(42, Math.round(heightEx * 10.5));

  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgElement.style.color = "#0f172a";

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  return { svgString, width, height };
};

/**
 * Compila e inserta la fórmula matemática en el lienzo de Sketion
 */
export const insertLaTeXSVGToCanvas = async (
  latex: string,
  api: any,
  x: number,
  y: number,
): Promise<void> => {
  try {
    const { svgString, width, height } = await renderLaTeXToSVG(latex);
    const dataURL = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    const fileId = `latex_svg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const imageElement = {
      type: "image" as const,
      id: `latex_node_${Date.now()}`,
      fileId,
      status: "saved" as const,
      x,
      y,
      width,
      height,
      strokeColor: "transparent",
      backgroundColor: "transparent",
      fillStyle: "solid" as const,
      strokeWidth: 1,
      strokeStyle: "solid" as const,
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
        latexCode: latex,
        isMathematicalNode: true,
      },
    };

    api.addFiles([
      {
        id: fileId,
        dataURL,
        mimeType: "image/svg+xml",
        created: Date.now(),
      },
    ]);

    const currentFiles = { ...(api.getFiles() || {}) };
    currentFiles[fileId] = {
      id: fileId,
      dataURL,
      mimeType: "image/svg+xml",
      created: Date.now(),
    };

    api.updateScene({
      elements: [...(api.getSceneElements() || []), imageElement],
      files: currentFiles,
    });

    api.scrollToContent([imageElement], { fitToViewport: true, viewportZoomFactor: 1.2 });
  } catch (err) {
    console.error("Error al insertar LaTeX en el lienzo:", err);
    throw err;
  }
};
