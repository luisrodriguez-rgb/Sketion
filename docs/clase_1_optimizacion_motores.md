# 📚 Optimización 05359-IND — Clase 1: Introducción al Análisis de Decisiones

**Universidad Icesi — Facultad Barberi de Ingeniería, Diseño y Ciencias Aplicadas**

Este documento detalla la estructura temática y pedagógica de la **Clase 1**, donde cada una de las 8 secciones principales ha sido construida aplicando el **Motor Visual Canónico (DSL)** que mejor se adapta a la naturaleza de la información.

---

## 🎨 Resumen de Motores Canónicos Utilizados por Sección

| Sección | Nombre del Bloque | Motor Visual Aplicado | Slug / Tipo |
| :--- | :--- | :---: | :---: |
| **Sección 01** | Bienvenida & Metodología | **C · Flujo** | `flujo` (Pasos Secuenciales) |
| **Sección 02** | Estructura del Curso & Evaluaciones | **G · Matriz** | `matriz` (Tabla NxM & Chips) |
| **Sección 03** | ¿Qué es Analítica? (5 Niveles) | **I · Árbol** | `arbol` (Jerarquía Descendente / Pirámide) |
| **Sección 04** | Analítica Prescriptiva en Acción | **A · Cerebro** | `cerebro` (Hub Central + Clusters) |
| **Sección 05** | Decisiones, Riesgo e Incertidumbre | **G · Matriz** | `matriz` (Comparativa + Espectro) |
| **Sección 06** | Componentes de un Modelo de Decisión | **C · Flujo** | `flujo` (Variables $\rightarrow$ Restricciones $\rightarrow$ Objetivo) |
| **Sección 07** | Taller de Repaso (10 Ejercicios) | **J · Timeline** | `timeline` (Eje Incremental con Hitos) |
| **Sección 08** | Cierre, Autoevaluación & Bibliografía | **K · Board** | `board` (Carriles Verticales Kanban) |

---

## 📖 Contenido Detallado por Secciones

### 01. Bienvenida (Motor C · Flujo)
- **Concepto**: Recorrido secuencial paso a paso de los 7 módulos iniciales de la clase.
- **Flujo de Pasos**:
  1. El curso (Metodología, evaluación e IAG).
  2. ¿Qué es Analítica? (De lo descriptivo a lo cognitivo).
  3. Prescriptiva en acción (Aplicaciones, insumos y retos).
  4. Decisiones y riesgo (Estructurado vs. no estructurado).
  5. Modelos de decisión (Variables, restricciones, función objetivo).
  6. Taller de repaso (10 ejercicios prácticos).
  7. Cierre (Síntesis y bibliografía).
- **Activación**: Pregunta detonante inicial (*"¿Qué datos genera tu negocio y se usan para decidir?"*).

---

### 02. El Curso (Motor G · Matriz)
- **Concepto**: Matriz transparente de ponderaciones y reglas de evaluación.
- **Distribución de Notas**:
  - **75% Nota Individual**: Parcial I (25%), Parcial II (25%), Parcial III (25%).
  - **25% Nota en Equipo**: Proyecto práctico (20%) + Presentación de artículo (5%).
- **Mapa de Unidades**:
  - *Unidad 1*: Introducción al análisis de decisiones.
  - *Unidad 2*: Modelado de Programación Lineal (PL) y Entera (PE).
  - *Unidad 3*: Algoritmos Simplex, análisis de sensibilidad y heurísticas.

---

### 03. ¿Qué es Analítica? (Motor I · Árbol / Pirámide)
- **Concepto**: Jerarquía descendente de los 5 niveles de madurez analítica.
- **Niveles de Madurez**:
  1. **Cognitiva**: *"¿Cómo puede el sistema razonar por sí mismo?"*
  2. **Prescriptiva (Foco del Curso)**: *"¿Qué debería hacer?"*
  3. **Predictiva**: *"¿Qué pasará?"*
  4. **Diagnóstica**: *"¿Por qué pasó?"*
  5. **Descriptiva**: *"¿Qué pasó? (Reportes e indicadores históricos)"*

---

### 04. Prescriptiva en Acción (Motor A · Cerebro)
- **Concepto**: Nodo central con 3 racimos (clusters) temáticos.
- **Clusters**:
  - **Aplicaciones**: Producción, logística, personal, compras, finanzas y marketing.
  - **Insumos del Modelo**: Datos operativos, recursos, restricciones y objetivos.
  - **Retos de Implementación**: Datos de mala calidad, resistencia al cambio y complejidad en la formulación.

---

### 05. Decisiones y Riesgo (Motor G · Matriz)
- **Concepto**: Comparación en 2 columnas y espectro continuo de incertidumbre.
- **Estructurada vs. No Estructurada**:
  - *Estructurada*: Modelable matemáticamente (rutas, producción, asignación).
  - *No Estructurada*: Juicio cualitativo (contratación de ejecutivos, lanzamientos).
- **Incertidumbre vs. Riesgo**:
  - *Incertidumbre*: Sin antecedentes ni probabilidades estimables.
  - *Riesgo*: Consecuencias y probabilidades conocidas/estimables.

---

### 06. Modelos de Decisión (Motor C · Flujo)
- **Concepto**: Secuencia de 3 componentes fundamentales de la Investigación de Operaciones.
- **Cadena de Modelado**:
  $$\text{Variables de Decisión} \longrightarrow \text{Restricciones} \longrightarrow \text{Función Objetivo}$$
- **Caso Resuelto (Sillas y Mesas)**:
  - *Variables*: $x$ = sillas, $y$ = mesas.
  - *Restricciones*: $2x + 4y \le 40$ (Horas), $3x + 2y \le 30$ (Madera), $x, y \ge 0$.
  - *Función Objetivo*: Maximizar $Z = 30x + 50y$.

---

### 07. Taller de Repaso (Motor J · Timeline)
- **Concepto**: Eje cronológico con 10 ejercicios de complejidad incremental.
- **Progresión de Ejercicios**:
  - Ejercicios 1 a 3: Restricciones de carpintería y demanda mínima.
  - Ejercicios 4 a 6: Incorporación de 3er producto (camas) y horas de acabado.
  - Ejercicios 7 a 10: Multi-proveedor, inventarios a 2 semanas y turnos extras opcionales.

---

### 08. Cierre (Motor K · Board)
- **Concepto**: Tablero Kanban de 4 carriles de consolidación.
- **Carriles**:
  1. **Síntesis**: Resumen de los aprendizajes clave de la clase.
  2. **Próxima Clase**: Ficha descriptiva del problema real de empresa.
  3. **Autoevaluación**: Chequeo de competencias adquiridas.
  4. **Bibliografía**: Libros de Hillier & Lieberman, Winston y recursos de MIT / IBM.

---

## 🎨 Archivo de Lienzo Renderizado

El lienzo interactivo con los 322 elementos vectoriales se encuentra compilado en:
`file:///Users/leonfeliperodriguez/Desktop/Trabajos/My-Excalidraw/My-Excalidraw/clase_1.excalidraw`
