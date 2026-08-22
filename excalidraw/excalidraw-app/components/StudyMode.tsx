import React, { useState, useEffect } from "react";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic?: string;
  elementId?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  icon: string;
  cards: Flashcard[];
}

interface StudyModeProps {
  isOpen: boolean;
  onClose: () => void;
  cards?: Flashcard[];
  onFocusElement?: (elementId: string) => void;
  activeBoardId?: string | null;
}

export const ACADEMIC_DECKS: FlashcardDeck[] = [
  {
    id: "deck_arquitectura",
    title: "Arquitectura & Cloud",
    icon: "",
    cards: [
      {
        id: "arq_1",
        topic: "Arquitectura de Software",
        question: "¿Cuál es el principio fundamental de la Arquitectura Hexagonal (Ports & Adapters)?",
        answer: "Aislar la lógica de dominio del núcleo de frameworks, bases de datos e interfaces externas mediante puertos (interfaces) y adaptadores (implementaciones concretas).",
      },
      {
        id: "arq_2",
        topic: "Microservicios & Consistencia",
        question: "¿Cómo garantiza el patrón Saga la consistencia eventual entre microservicios?",
        answer: "Ejecuta transacciones locales secuenciales en cada servicio. Si una falla, ejecuta transacciones compensatorias en orden inverso para revertir el estado.",
      },
      {
        id: "arq_3",
        topic: "Sistemas Distribuidos",
        question: "¿Qué postula el Teorema CAP para bases de datos distribuidas?",
        answer: "Es imposible garantizar simultáneamente Consistencia estricta (C), Disponibilidad (A) y Tolerancia a Particiones de red (P). Ante partición, se debe elegir entre C o A.",
      },
      {
        id: "arq_4",
        topic: "Sistemas RAG & Embeddings",
        question: "¿Cuál es el rol de una Base de Datos Vectorial en un pipeline RAG?",
        answer: "Almacena embeddings semánticos y ejecuta búsqueda de vecinos más cercanos (k-NN / HNSW) para recuperar fragmentos de contexto relevantes antes de pasarlos al LLM.",
      },
    ],
  },
  {
    id: "deck_optimizacion",
    title: "Optimización & IO",
    icon: "",
    cards: [
      {
        id: "opt_1",
        topic: "Programación Lineal",
        question: "¿En qué punto geométrico se encuentra siempre la solución óptima de un problema lineal convexo?",
        answer: "En al menos uno de los vértices o puntos extremos de la región factible (politopo convexo).",
      },
      {
        id: "opt_2",
        topic: "Condiciones KKT",
        question: "¿Para qué sirven las condiciones de Karush-Kuhn-Tucker (KKT)?",
        answer: "Son condiciones necesarias de primer orden para que una solución en programación no lineal con restricciones de desigualdad sea óptima.",
      },
      {
        id: "opt_3",
        topic: "Dualidad en Optimización",
        question: "¿Qué relación establece el Teorema Fuerte de Dualidad?",
        answer: "Si el problema primal tiene solución óptima finita, el problema dual también la tiene y ambos valores óptimos coinciden exactamente (brecha de dualidad = 0).",
      },
    ],
  },
  {
    id: "deck_sketion",
    title: "Sketion Workspace",
    icon: "",
    cards: [
      {
        id: "sk_1",
        topic: "Local-First & Sync",
        question: "¿Qué ventaja otorga la arquitectura Local-First basada en IndexedDB?",
        answer: "Permite trabajar sin latencia y 100% fuera de línea. La sincronización a la nube con Supabase ocurre en segundo plano de forma asíncrona sin bloquear la UI.",
      },
      {
        id: "sk_2",
        topic: "Optimización de PDF",
        question: "¿Cómo optimiza el motor PDF Fast Engine el consumo de memoria en el navegador?",
        answer: "Renderiza páginas a resolución adaptativa HD (máx 1200px) y genera Blobs JPEG al 75%, reduciendo el consumo en >90% por página (~70KB).",
      },
      {
        id: "sk_3",
        topic: "Seguridad & Roles",
        question: "¿Cómo restringe Sketion el acceso en modo solo lectura para invitados?",
        answer: "Mediante el parámetro ?role=viewer en la URL, bloqueando la edición del canvas y ocultando herramientas destructivas de forma no intrusiva.",
      },
    ],
  },
];

export const StudyMode: React.FC<StudyModeProps> = ({
  isOpen,
  onClose,
  cards,
  onFocusElement,
  activeBoardId,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>("deck_arquitectura");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Obtener lista activa de tarjetas
  const activeDeck = ACADEMIC_DECKS.find((d) => d.id === selectedDeckId) || ACADEMIC_DECKS[0];
  const activeCards: Flashcard[] = cards && cards.length > 0 ? cards : activeDeck.cards;

  // Persistencia de tarjetas dominadas en localStorage
  const storageKey = `sketion_study_mastered_${activeBoardId || selectedDeckId}`;
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setCompletedIds(stored ? JSON.parse(stored) : []);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch {
      setCompletedIds([]);
    }
  }, [selectedDeckId, storageKey]);

  if (!isOpen) return null;

  const currentCard = activeCards[currentIndex] || activeCards[0];
  const progressPercent = activeCards.length > 0 ? Math.round((completedIds.length / activeCards.length) * 100) : 0;

  const handleNext = (mastered = false) => {
    if (mastered && currentCard && !completedIds.includes(currentCard.id)) {
      const updated = [...completedIds, currentCard.id];
      setCompletedIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error("Error saving mastered flashcards:", err);
      }
    }
    setIsFlipped(false);
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleResetProgress = () => {
    setCompletedIds([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error("Error clearing progress:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "600px",
          padding: "26px",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>Modo Estudio — Repaso Activo</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Memorización activa con repetición espaciada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}
          >
            ✕
          </button>
        </div>

        {/* Selector de Barajas / Decks */}
        {(!cards || cards.length === 0) && (
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
            {ACADEMIC_DECKS.map((deck) => (
              <button
                key={deck.id}
                onClick={() => {
                  setSelectedDeckId(deck.id);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: "10px",
                  border: selectedDeckId === deck.id ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                  backgroundColor: selectedDeckId === deck.id ? "#eff6ff" : "#f8fafc",
                  color: selectedDeckId === deck.id ? "#1d4ed8" : "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{deck.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Barra de Progreso */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
            <span>Tarjeta {currentIndex + 1} de {activeCards.length}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>{progressPercent}% Dominado ({completedIds.length}/{activeCards.length})</span>
              {completedIds.length > 0 && (
                <button
                  onClick={handleResetProgress}
                  title="Reiniciar progreso de esta baraja"
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "11px", textDecoration: "underline" }}
                >
                  Reiniciar
                </button>
              )}
            </div>
          </div>
          <div style={{ width: "100%", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: "#2563eb", transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* Tarjeta Flashcard */}
        {currentCard && (
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              minHeight: "220px",
              borderRadius: "16px",
              border: isFlipped ? "2px solid #93c5fd" : "2px solid #e2e8f0",
              backgroundColor: isFlipped ? "#f8fafc" : "#ffffff",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
              position: "relative",
            }}
          >
            {currentCard.topic && (
              <span style={{ position: "absolute", top: "14px", left: "16px", fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {currentCard.topic}
              </span>
            )}

            {currentCard.elementId && onFocusElement && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentCard.elementId) {
                    onFocusElement(currentCard.elementId);
                  }
                }}
                title="Centrar elemento en el lienzo"
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  padding: "5px 10px",
                  borderRadius: "7px",
                  border: "1px solid #2563eb",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ver en Canvas
              </button>
            )}

            {!currentCard.elementId && (
              <span style={{ position: "absolute", top: "14px", right: "16px", fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>
                {isFlipped ? "Respuesta" : "Pregunta (Clic para voltear)"}
              </span>
            )}

            <p style={{ fontSize: "15.5px", fontWeight: isFlipped ? 500 : 700, color: isFlipped ? "#1e293b" : "#0f172a", margin: 0, lineHeight: 1.55, maxWidth: "480px" }}>
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>
          </div>
        )}

        {/* Acciones Inferiores */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "space-between", marginTop: "4px" }}>
          <button
            onClick={() => handleNext(false)}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Revisar Luego
          </button>
          <button
            onClick={() => handleNext(true)}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            Dominado
          </button>
        </div>
      </div>
    </div>
  );
};
