"""
Sketion Curated Template Library Generator (v10.0 GA)
Genera el catálogo completo de las 62 plantillas curadas de Sketion
en 6 categorías temáticas: Estudio, Ingeniería, Software & IA, Negocios, Diseño & UX, Productividad.
Exporta cada plantilla en .excalidraw y .svg vectorial web estándar.
"""

import os
import sys

workspace_dir = "/Users/leonfeliperodriguez/Desktop/Trabajos/Sketion SKILL"
sys.path.insert(0, workspace_dir)

from render.excalidraw_builder import ExcalidrawScene
from export.svg_exporter import SVGExporter
from visual_intelligence.visual_types_27 import VisualTypes27Engine

BASE_DIR = os.path.join(workspace_dir, "templates")

CATEGORIES = {
    "estudio": os.path.join(BASE_DIR, "estudio"),
    "ingenieria": os.path.join(BASE_DIR, "ingenieria"),
    "software_ia": os.path.join(BASE_DIR, "software_ia"),
    "negocios": os.path.join(BASE_DIR, "negocios"),
    "diseno_ux": os.path.join(BASE_DIR, "diseno_ux"),
    "productividad": os.path.join(BASE_DIR, "productividad"),
}

for d in CATEGORIES.values():
    os.makedirs(d, exist_ok=True)


def create_base_scene(title: str, category: str, tw: float = 1450.0, th: float = 480.0):
    scene = ExcalidrawScene(roughness=0, bg_color="#F8FAFC")
    fid = scene.add_frame(title.upper(), 10, 10, tw, th)
    scene.add_text(30, 35, f"SKETION TEMPLATE LIBRARY · {category.upper()} · INTER VECTORIAL", font_size=11, font_family=3, color="#64748B", frame_id=fid)
    return scene, fid, tw, th


def save_and_export(scene: ExcalidrawScene, fid: str, cat_key: str, filename: str):
    scene.auto_fit_frame(fid, padding=35.0)
    out_dir = CATEGORIES[cat_key]
    excal_path = os.path.join(out_dir, f"{filename}.excalidraw")
    svg_path = os.path.join(out_dir, f"{filename}.svg")
    scene.save(excal_path)
    SVGExporter.export(scene.to_dict(), svg_path)
    print(f"   [OK] {cat_key}/{filename} (.svg & .excalidraw)")


# ===================================================================================================
# 1. ESTUDIO (10 Plantillas)
# ===================================================================================================

def gen_estudio():
    print("\n--- Generando Plantillas de ESTUDIO ---")

    # 1. Study Notes
    scene, fid, tw, th = create_base_scene("Study Notes & Class Synthesis", "ESTUDIO")
    scene.add_rect(30, 70, 380, 370, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(50, 90, "PREGUNTAS CLAVE & INDICIOS", font_size=12, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(50, 130, "* Concepto principal de la sesion\n* Pregunta central de examen\n* Formulas a memorizar\n* Definiciones clave", font_size=11, font_family=3, color="#334155", frame_id=fid)
    
    scene.add_rect(430, 70, 680, 260, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(450, 90, "NOTAS DETALLADAS & DESARROLLO", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(450, 130, "1. Explicacion paso a paso del teorema o modelo analitico\n2. Casos de aplicacion practica y ejemplos numericos\n3. Observaciones del docente y advertencias sobre errores comunes\n4. Demostracion formal y propiedades estructurales", font_size=11, font_family=3, color="#475569", frame_id=fid)

    scene.add_rect(430, 345, 680, 95, bg="#FFF5F2", stroke="#D93829", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(450, 360, "RESUMEN EJECUTIVO (SUMMARY BOX)", font_size=11, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(450, 390, "Conclusion sintetica en 2 frases sobre la idea central de la clase.", font_size=11, font_family=3, color="#334155", frame_id=fid)
    
    scene.add_rect(1130, 70, 280, 370, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(1150, 90, "ACCIONES POST-CLASE", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(1150, 130, "[ ] Resolver guia taller #3\n[ ] Crear flashcards Anki\n[ ] Consultar capitulo 4 libro\n[ ] Repaso espaciado en 48h", font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "estudio", "01_study_notes")

    # 2. Mind Map
    scene, fid, tw, th = create_base_scene("Mind Map Conceptual", "ESTUDIO")
    cx, cy = 720, 240
    scene.add_rect(cx - 130, cy - 45, 260, 90, bg="#FFF5F2", stroke="#D93829", stroke_w=2.0, roundness_type=3, frame_id=fid)
    scene.add_text(cx - 100, cy - 15, "CONCEPTO CENTRAL", font_size=14, font_family=3, color="#D93829", frame_id=fid)
    
    nodes = [
        ("1. Fundamentos", cx - 450, cy - 120),
        ("2. Metodos", cx + 250, cy - 120),
        ("3. Aplicaciones", cx - 450, cy + 120),
        ("4. Evaluacion", cx + 250, cy + 120)
    ]
    for lbl, nx, ny in nodes:
        scene.add_rect(nx, ny, 200, 70, bg="#FFFFFF", stroke="#0F172A", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(nx + 20, ny + 25, lbl, font_size=11, font_family=3, color="#0F172A", frame_id=fid)
        scene.add_arrow(cx + (130 if nx > cx else -130), cy, nx + (0 if nx > cx else 200), ny + 35, stroke="#94A3B8", frame_id=fid)
    save_and_export(scene, fid, "estudio", "02_mind_map")

    # 3. Concept Map
    scene, fid, tw, th = create_base_scene("Concept Map jerarquico", "ESTUDIO")
    scene.add_quad_card(600, 70, 250, 70, "CONCEPTO RAIZ", "Teoria General", is_hero=True, frame_id=fid)
    scene.add_quad_card(320, 240, 240, 70, "Principio A", "Reglas y Axiomas", frame_id=fid)
    scene.add_quad_card(880, 240, 240, 70, "Principio B", "Modelos y Calculo", frame_id=fid)
    scene.add_arrow(725, 140, 440, 240, stroke="#D93829", stroke_w=1.5, frame_id=fid)
    scene.add_arrow(725, 140, 1000, 240, stroke="#D93829", stroke_w=1.5, frame_id=fid)
    scene.add_text(480, 180, "se subdivide en", font_size=10, font_family=3, color="#64748B", frame_id=fid)
    scene.add_text(850, 180, "se formaliza mediante", font_size=10, font_family=3, color="#64748B", frame_id=fid)
    save_and_export(scene, fid, "estudio", "03_concept_map")

    # 4. Reading Summary
    scene, fid, tw, th = create_base_scene("Reading Summary & Synthesis", "ESTUDIO")
    scene.add_rect(40, 70, 400, 360, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(60, 95, "TESIS Y OBJETIVO DEL AUTOR", font_size=12, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(60, 135, "Titulo de la obra: 'Arquitectura Limpia'\nAutor: Robert C. Martin\nTesis: El desacoplamiento entre las\nreglas de negocio y los frameworks\ngarantiza la longevidad del sistema.", font_size=11, font_family=3, color="#334155", frame_id=fid)
    
    scene.add_rect(460, 70, 500, 360, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(480, 95, "ARGUMENTOS CLAVE & EVIDENCIA", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(480, 135, "1. Dependencias apuntan siempre hacia adentro.\n2. Los detalles de BD y Web son accesorios.\n3. La inversion de dependencias protege el core.\n4. Las entidades no conocen los casos de uso.", font_size=11, font_family=3, color="#475569", frame_id=fid)

    scene.add_rect(980, 70, 430, 360, bg="#FFF5F2", stroke="#D93829", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(1000, 95, "CONCLUSION & APLICACION", font_size=12, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(1000, 135, "Impacto en mis proyectos:\n* Aislar logica de dominio en servicios puros.\n* Evitar acoplar ORM a las entidades de negocio.", font_size=11, font_family=3, color="#334155", frame_id=fid)
    save_and_export(scene, fid, "estudio", "04_reading_summary")

    # 5. Exam Preparation
    scene, fid, tw, th = create_base_scene("Exam Preparation Matrix", "ESTUDIO")
    headers = ["TEMA DE EXAMEN", "DIFICULTAD", "ESTADO", "HORAS ESTIMADAS", "ACCION CLAVE"]
    xs = [40, 340, 540, 740, 1000]
    for h_txt, h_x in zip(headers, xs):
        scene.add_text(h_x, 80, h_txt, font_size=11, font_family=3, color="#64748B", frame_id=fid)
    rows = [
        ("1. Programacion Dinamica", "ALTA", "REPASO", "4h", "Resolver ejercicios LeetCode Hard"),
        ("2. Grafos y BFS / DFS", "MEDIA", "DOMINADO", "2h", "Revisar implementacion de Dijkstra"),
        ("3. Arboles AVL y Red-Black", "ALTA", "PENDIENTE", "3h", "Dibujar rotaciones a mano"),
        ("4. Analisis Asintotico Big-O", "BAJA", "DOMINADO", "1h", "Repaso de cotas ajustadas")
    ]
    for idx, (t, d, s, h, a) in enumerate(rows):
        ry = 120 + idx * 75
        is_hero = idx == 0
        scene.add_rect(30, ry, tw - 60, 65, bg="#FFF5F2" if is_hero else "#FFFFFF", stroke="#D93829" if is_hero else "#E2E8F0", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(40, ry + 22, t, font_size=11, font_family=3, color="#0F172A", frame_id=fid)
        scene.add_text(340, ry + 22, d, font_size=11, font_family=3, color="#D93829" if d == "ALTA" else "#0F172A", frame_id=fid)
        scene.add_text(540, ry + 22, s, font_size=11, font_family=3, color="#059669" if s == "DOMINADO" else "#D97706", frame_id=fid)
        scene.add_text(740, ry + 22, h, font_size=11, font_family=3, color="#64748B", frame_id=fid)
        scene.add_text(1000, ry + 22, a, font_size=11, font_family=3, color="#334155", frame_id=fid)
    save_and_export(scene, fid, "estudio", "05_exam_prep")

    # 6. Flashcard Board
    scene, fid, tw, th = create_base_scene("Flashcard Memory Board", "ESTUDIO")
    cards = [
        ("TEOREMA DE CAP", "Consistencia, Disponibilidad\ny Tolerancia a Particiones.", True),
        ("PRINCIPIO SOLID", "5 principios de diseño orientado\na objetos y arquitectura.", False),
        ("ACID vs BASE", "Transacciones estrictas vs\nconsistencia eventual.", False),
        ("RPO & RTO", "Recovery Point Objective &\nRecovery Time Objective.", False),
        ("OIDC & OAUTH2", "Protocolos de autenticacion y\nautorizacion con tokens JWT.", False),
        ("BLOOM FILTER", "Estructura probabilistica para\ncomprobar membresia.", False)
    ]
    for idx, (head, body, is_h) in enumerate(cards):
        col = idx % 3
        row = idx // 3
        cx = 50 + col * 460
        cy = 80 + row * 175
        scene.add_rect(cx, cy, 430, 150, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(cx + 25, cy + 25, head, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(cx + 25, cy + 65, body, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "estudio", "06_flashcard_board")

    # 7. Research Canvas
    scene, fid, tw, th = create_base_scene("Research & Literature Canvas", "ESTUDIO")
    boxes = [
        ("1. PREGUNTA DE INVESTIGACION", "¿Como optimizar la latencia en pipelines distribuidos?", 40, 80, 420, 160, True),
        ("2. HIPOTESIS CENTRAL", "El uso de buffers en memoria compartida reduce la latencia P99 un 40%.", 480, 80, 460, 160, False),
        ("3. METODOLOGIA", "Benchmarks comparativos sobre clúster Kubernetes con carga sintetica.", 960, 80, 440, 160, False),
        ("4. HALLAZGOS", "Reduccion del 42.5% en latencia y disminucion del 18% en consumo de memoria.", 40, 260, 660, 170, False),
        ("5. LIMITACIONES & FUENTES", "No evaluado bajo saturacion extrema de red. Fuentes: IEEE 2024.", 720, 260, 680, 170, False)
    ]
    for b_title, b_desc, bx, by, bw, bh, is_h in boxes:
        scene.add_rect(bx, by, bw, bh, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(bx + 20, by + 20, b_title, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(bx + 20, by + 60, b_desc, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "estudio", "07_research_canvas")

    # 8. Cornell Notes
    scene, fid, tw, th = create_base_scene("Sistema Cornell Notes", "ESTUDIO")
    scene.add_rect(40, 70, 360, 260, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(60, 90, "CUE COLUMN (INDICIOS / PREGUNTAS)", font_size=11, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(60, 130, "¿Por que desacoplar la persistencia?\n¿Cual es el coste de consistencia?\n¿Cuando usar event sourcing?", font_size=11, font_family=3, color="#334155", frame_id=fid)
    
    scene.add_rect(420, 70, 980, 260, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(440, 90, "NOTE-TAKING COLUMN (NOTAS DE CLASE)", font_size=11, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(440, 130, "El desacoplamiento permite cambiar el motor de persistencia sin tocar la logica de negocio.\nLa consistencia eventual permite escalar horizontalmente manteniendo alta disponibilidad.\nEvent Sourcing almacena cada mutacion de estado como un hecho inmutable append-only.", font_size=11, font_family=3, color="#475569", frame_id=fid)

    scene.add_rect(40, 345, 1360, 95, bg="#FFF5F2", stroke="#D93829", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(60, 360, "SUMMARY (SINTESIS AL FINALIZAR)", font_size=11, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(60, 390, "La arquitectura modular protege el dominio del sistema y permite escalabilidad controlada.", font_size=11, font_family=3, color="#334155", frame_id=fid)
    save_and_export(scene, fid, "estudio", "08_cornell_notes")

    # 9. Lecture Review
    scene, fid, tw, th = create_base_scene("Lecture Review & Retencion", "ESTUDIO")
    sec = [
        ("1. IDEAS PRINCIPALES", "3 conceptos indispensables aprendidos hoy.", 40, 80, 440, 350, True),
        ("2. DUDAS & PREGUNTAS", "Temas que requieren tutoria o investigacion.", 500, 80, 440, 350, False),
        ("3. CONEXION CON EL MUNDO REAL", "¿Donde se aplica esta teoria en la industria?", 960, 80, 440, 350, False)
    ]
    for st, sd, sx, sy, sw, sh, is_h in sec:
        scene.add_rect(sx, sy, sw, sh, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(sx + 20, sy + 25, st, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(sx + 20, sy + 70, sd, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "estudio", "09_lecture_review")

    # 10. Learning Roadmap
    scene, fid, tw, th = create_base_scene("Learning Roadmap Escalonado", "ESTUDIO")
    steps = [
        ("NIVEL 1: FUNDAMENTOS", "Sintaxis, Estructuras, Algoritmos", 40, False),
        ("NIVEL 2: INTERMEDIO", "Patrones de Diseno, Testing, Concurrencia", 390, False),
        ("NIVEL 3: AVANZADO", "Sistemas Distribuidos, Cloud, Profiling", 740, True),
        ("NIVEL 4: MAESTRIA", "Investigacion, Optimizacion de Kernel", 1090, False)
    ]
    for idx, (title, sub, px, is_h) in enumerate(steps):
        scene.add_quad_card(px, 120, 310, 150, title, sub, badge=f"FASE {idx+1}", is_hero=is_h, frame_id=fid)
        if idx < len(steps) - 1:
            scene.add_arrow(px + 310, 195, steps[idx+1][2], 195, stroke="#D93829" if is_h else "#94A3B8", stroke_w=1.8, frame_id=fid)
    save_and_export(scene, fid, "estudio", "10_learning_roadmap")


# ===================================================================================================
# 2. INGENIERÍA (10 Plantillas)
# ===================================================================================================

def gen_ingenieria():
    print("\n--- Generando Plantillas de INGENIERÍA ---")

    # 1. SIPOC
    scene, fid, tw, th = create_base_scene("SIPOC Process Analysis", "INGENIERÍA")
    cols = ["SUPPLIERS", "INPUTS", "PROCESS", "OUTPUTS", "CUSTOMERS"]
    descs = [
        "Proveedores de materia prima\ny especificaciones tecnicas",
        "Materiales, energia, APIs\ny requerimientos de diseno",
        "Transformacion paso a paso\ncon controles de calidad",
        "Producto terminado, reportes\ny metricas de produccion",
        "Clientes finales, plantas\ny operadores de servicio"
    ]
    for i, (c, d) in enumerate(zip(cols, descs)):
        cx = 40 + i * 275
        is_hero = i == 2
        scene.add_rect(cx, 80, 260, 350, bg="#FFF5F2" if is_hero else "#FFFFFF", stroke="#D93829" if is_hero else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(cx + 20, 105, c, font_size=13, font_family=3, color="#D93829" if is_hero else "#0F172A", frame_id=fid)
        scene.add_text(cx + 20, 150, d, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "01_sipoc")

    # 2. Value Stream Mapping
    scene, fid, tw, th = create_base_scene("Value Stream Mapping (VSM)", "INGENIERÍA")
    scene.add_rect(40, 80, 1360, 80, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(60, 105, "CONTROL DE INFORMACION & PLANIFICACION DE DEMANDA (ERP / MRP)", font_size=11, font_family=3, color="#64748B", frame_id=fid)
    
    stages = ["1. Corte & CNC", "2. Ensamblaje", "3. Soldadura", "4. Inspeccion QA", "5. Despacho"]
    for i, s in enumerate(stages):
        sx = 40 + i * 275
        scene.add_quad_card(sx, 180, 260, 120, s, "Cycle Time: 45s\nUptime: 98%", badge=f"PASO {i+1}", is_hero=(i==1), frame_id=fid)
    
    scene.add_rect(40, 330, 1360, 80, bg="#FFF5F2", stroke="#D93829", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(60, 355, "LEAD TIME TOTAL: 4.2 DIAS · PROCESSING TIME (TIEMPO DE VALOR REAL): 18.5 MINUTOS", font_size=12, font_family=3, color="#D93829", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "02_value_stream_mapping")

    # 3. Process Map
    scene, fid, tw, th = create_base_scene("Process Map Operacional", "INGENIERÍA")
    scene.add_quad_card(40, 160, 220, 100, "1. Ingestion", "Recepcion de Lote", frame_id=fid)
    scene.add_arrow(260, 210, 340, 210, stroke="#94A3B8", frame_id=fid)
    scene.add_diamond(340, 150, 120, 120, bg="#FFF5F2", stroke="#D93829", stroke_w=1.8, frame_id=fid)
    scene.add_text(370, 200, "¿Valido?", font_size=11, font_family=3, color="#D93829", frame_id=fid)
    scene.add_arrow(460, 210, 560, 210, stroke="#D93829", frame_id=fid)
    scene.add_text(485, 190, "SI", font_size=10, font_family=3, color="#D93829", frame_id=fid)
    scene.add_quad_card(560, 160, 260, 100, "2. Procesamiento", "Operacion Principal", is_hero=True, frame_id=fid)
    scene.add_arrow(820, 210, 920, 210, stroke="#94A3B8", frame_id=fid)
    scene.add_quad_card(920, 160, 220, 100, "3. Finalizacion", "Almacenaje y Salida", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "03_process_map")

    # 4. Fishbone / Ishikawa
    scene, fid, tw, th = create_base_scene("Diagrama de Ishikawa (Causa-Efecto)", "INGENIERÍA")
    scene.add_line(80, 240, 1100, 240, stroke="#0F172A", stroke_w=3.0, frame_id=fid)
    scene.add_rect(1120, 180, 280, 120, bg="#FFF5F2", stroke="#D93829", stroke_w=2.0, roundness_type=3, frame_id=fid)
    scene.add_text(1150, 220, "DEFECTO / PROBLEMA\n(Efecto Principal)", font_size=13, font_family=3, color="#D93829", frame_id=fid)
    
    branches = [
        ("METODOS", 250, 100, 350, 240),
        ("MAQUINAS", 550, 100, 650, 240),
        ("MATERIALES", 850, 100, 950, 240),
        ("MANO DE OBRA", 250, 380, 350, 240),
        ("MEDICION", 550, 380, 650, 240),
        ("MEDIO AMBIENTE", 850, 380, 950, 240)
    ]
    for b_lbl, bx, by, ex, ey in branches:
        scene.add_line(bx, by, ex, ey, stroke="#94A3B8", stroke_w=1.8, frame_id=fid)
        scene.add_rect(bx - 20, by - 20, 150, 40, bg="#FFFFFF", stroke="#0F172A", stroke_w=1.2, roundness_type=3, frame_id=fid)
        scene.add_text(bx - 5, by - 8, b_lbl, font_size=10, font_family=3, color="#0F172A", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "04_fishbone_ishikawa")

    # 5. FMEA
    scene, fid, tw, th = create_base_scene("FMEA Risk & Failure Mode Analysis", "INGENIERÍA")
    f_headers = ["COMPONENTE", "MODO DE FALLO", "EFECTO", "SEV", "OCU", "DET", "RPN", "ACCION CORRECTIVA"]
    f_xs = [40, 220, 430, 650, 710, 770, 830, 950]
    for fh, fx_pos in zip(f_headers, f_xs):
        scene.add_text(fx_pos, 85, fh, font_size=11, font_family=3, color="#64748B", frame_id=fid)
    f_rows = [
        ("Sensor de Presion", "Descalibracion", "Lectura erronea en caldera", "8", "3", "4", "96", "Mantenimiento preventivo quincenal"),
        ("Valvula de Seguridad", "Bloqueo mecanico", "Sobrepresion catastrofica", "10", "2", "2", "40", "Redundancia dual con bypass"),
        ("Bomba Hidraulica", "Cavitacion", "Perdida de caudal de linea", "6", "4", "3", "72", "Monitoreo acustico en tiempo real")
    ]
    for idx, r in enumerate(f_rows):
        ry = 130 + idx * 85
        scene.add_rect(30, ry, tw - 60, 70, bg="#FFF5F2" if idx==1 else "#FFFFFF", stroke="#D93829" if idx==1 else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        for val, fx_pos in zip(r, f_xs):
            scene.add_text(fx_pos, ry + 25, val, font_size=11, font_family=3, color="#D93829" if val in ["10", "96"] else "#0F172A", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "05_fmea")

    # 6. Pareto Analysis
    scene, fid, tw, th = create_base_scene("Pareto Analysis (80/20 Rule)", "INGENIERÍA")
    scene.add_line(80, 360, 1350, 360, stroke="#0F172A", stroke_w=2.0, frame_id=fid)
    scene.add_line(80, 100, 80, 360, stroke="#0F172A", stroke_w=2.0, frame_id=fid)
    bars = [("Fallo Motor", 220, 55, True), ("Fuga Tuberia", 160, 25, True), ("Desgaste", 90, 12, False), ("Electrico", 50, 5, False), ("Otros", 30, 3, False)]
    for i, (b_name, b_h, b_pct, is_80) in enumerate(bars):
        bx = 140 + i * 240
        scene.add_rect(bx, 360 - b_h, 180, b_h, bg="#FFF5F2" if is_80 else "#E2E8F0", stroke="#D93829" if is_80 else "#94A3B8", stroke_w=1.5, frame_id=fid)
        scene.add_text(bx + 20, 375, b_name, font_size=11, font_family=3, color="#0F172A", frame_id=fid)
        scene.add_text(bx + 60, 360 - b_h - 25, f"{b_pct}%", font_size=11, font_family=3, color="#D93829" if is_80 else "#64748B", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "06_pareto_analysis")

    # 7. Risk Matrix
    scene, fid, tw, th = create_base_scene("Risk Matrix (Probabilidad x Impacto)", "INGENIERÍA")
    VisualTypes27Engine.render_consultant_2x2(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "07_risk_matrix")

    # 8. Capacity Planning
    scene, fid, tw, th = create_base_scene("Capacity & Bottleneck Planning", "INGENIERÍA")
    caps = [
        ("ESTACION 1: INGRESO", "Capacidad: 120 u/h\nCarga Real: 95 u/h", False),
        ("ESTACION 2: MECANIZADO", "Capacidad: 80 u/h\nCarga Real: 80 u/h (CUELLO DE BOTELLA)", True),
        ("ESTACION 3: ENSAMBLAJE", "Capacidad: 150 u/h\nCarga Real: 80 u/h", False),
        ("ESTACION 4: EMPAQUE", "Capacidad: 200 u/h\nCarga Real: 80 u/h", False)
    ]
    for i, (c_t, c_d, is_h) in enumerate(caps):
        cx = 40 + i * 350
        scene.add_quad_card(cx, 140, 320, 150, c_t, c_d, badge="OPERACION", is_hero=is_h, frame_id=fid)
        if i < len(caps) - 1:
            scene.add_arrow(cx + 320, 215, caps[i+1][2] if hasattr(caps[i+1], '__getitem__') else cx + 350, 215, stroke="#D93829" if is_h else "#94A3B8", stroke_w=1.8, frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "08_capacity_planning")

    # 9. Root Cause Analysis (5 Whys)
    scene, fid, tw, th = create_base_scene("Root Cause Analysis (5 Whys)", "INGENIERÍA")
    whys = [
        ("PROBLEMA INICIAL", "El servidor de pagos dejo de responder a las 14:00.", False),
        ("1. ¿POR QUE?", "La memoria RAM del contenedor se saturo al 100%.", False),
        ("2. ¿POR QUE?", "Se acumularon 400.000 peticiones en cola sin liberar.", False),
        ("3. ¿POR QUE?", "El driver de base de datos no tenia configurado connection timeout.", False),
        ("4. ¿POR QUE?", "Se utilizo la configuracion por defecto en produccion.", False),
        ("5. CAUSA RAIZ", "Falta de validacion de perfiles de conexion en el pipeline CI/CD.", True)
    ]
    for idx, (w_t, w_d, is_h) in enumerate(whys):
        wy = 80 + idx * 60
        scene.add_rect(40, wy, tw - 80, 50, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#E2E8F0", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(60, wy + 15, w_t, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(260, wy + 15, w_d, font_size=11, font_family=3, color="#334155", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "09_root_cause_analysis")

    # 10. Continuous Improvement Board (Kaizen / PDCA)
    scene, fid, tw, th = create_base_scene("Continuous Improvement (PDCA Cycle)", "INGENIERÍA")
    pdca = [
        ("1. PLAN (PLANEAR)", "Identificar oportunidad de mejora,\nanalizar datos y disenar solucion.", 40, False),
        ("2. DO (HACER)", "Implementar prueba piloto controlada\nen una linea de produccion.", 390, False),
        ("3. CHECK (VERIFICAR)", "Medir KPIs de reduccion de desperdicio\ny comparar contra el baseline.", 740, True),
        ("4. ACT (ACTUAR)", "Estandarizar el proceso y escalar a\ntodas las plantas de la compania.", 1090, False)
    ]
    for p_t, p_d, px, is_h in pdca:
        scene.add_rect(px, 120, 310, 260, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(px + 20, 150, p_t, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(px + 20, 200, p_d, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "ingenieria", "10_continuous_improvement_kaizen")


# ===================================================================================================
# 3. SOFTWARE & IA (12 Plantillas)
# ===================================================================================================

def gen_software_ia():
    print("\n--- Generando Plantillas de SOFTWARE & IA ---")

    # 1. System Design
    scene, fid, tw, th = create_base_scene("System Design High-Scale Architecture", "SOFTWARE & IA")
    VisualTypes27Engine.render_architecture(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "01_system_design")

    # 2. Software Architecture (Layered)
    scene, fid, tw, th = create_base_scene("Software Architecture Layered VPC", "SOFTWARE & IA")
    VisualTypes27Engine.render_layer_stack(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "02_software_architecture")

    # 3. API Architecture
    scene, fid, tw, th = create_base_scene("API Architecture & Gateway Routing", "SOFTWARE & IA")
    scene.add_quad_card(40, 160, 240, 110, "Client Apps", "Web & Mobile SPA", badge="CLIENT", is_hero=False, frame_id=fid)
    scene.add_arrow(280, 215, 380, 215, stroke="#94A3B8", frame_id=fid)
    scene.add_quad_card(380, 130, 280, 150, "Kong API Gateway", "JWT, Rate Limiting & SSL", badge="GATEWAY", is_hero=True, frame_id=fid)
    scene.add_arrow(660, 180, 760, 130, stroke="#D93829", stroke_w=1.5, frame_id=fid)
    scene.add_arrow(660, 230, 760, 280, stroke="#D93829", stroke_w=1.5, frame_id=fid)
    scene.add_quad_card(760, 80, 280, 100, "Users Microservice", "FastAPI / Python", badge="SERVICE", frame_id=fid)
    scene.add_quad_card(760, 240, 280, 100, "Orders Microservice", "Go / Gin Engine", badge="SERVICE", frame_id=fid)
    scene.add_database_cylinder(1120, 80, 260, 100, "PostgreSQL Users", "ACID Storage", frame_id=fid)
    scene.add_database_cylinder(1120, 240, 260, 100, "PostgreSQL Orders", "ACID Storage", frame_id=fid)
    save_and_export(scene, fid, "software_ia", "03_api_architecture")

    # 4. Database Schema (ER)
    scene, fid, tw, th = create_base_scene("Database Schema (Relational ER Model)", "SOFTWARE & IA")
    VisualTypes27Engine.render_er_model(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "04_database_schema")

    # 5. Microservices Architecture
    scene, fid, tw, th = create_base_scene("Microservices Cluster Architecture", "SOFTWARE & IA")
    VisualTypes27Engine.render_high_level(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "05_microservices_architecture")

    # 6. Event-Driven Architecture
    scene, fid, tw, th = create_base_scene("Event-Driven Architecture (Kafka Bus)", "SOFTWARE & IA")
    scene.add_quad_card(40, 160, 240, 110, "Order Producer", "Genera order.created", frame_id=fid)
    scene.add_arrow(280, 215, 380, 215, stroke="#94A3B8", frame_id=fid)
    scene.add_streaming_pipe(380, 140, 360, 140, "Apache Kafka Cluster", ["orders.v1", "payments.v1", "notifications.v1"], badge="EVENT BUS", frame_id=fid)
    scene.add_arrow(740, 215, 840, 130, stroke="#D93829", stroke_w=1.5, frame_id=fid)
    scene.add_arrow(740, 215, 840, 280, stroke="#D93829", stroke_w=1.5, frame_id=fid)
    scene.add_quad_card(840, 80, 280, 100, "Payment Consumer", "Stripe Processor", is_hero=True, frame_id=fid)
    scene.add_quad_card(840, 240, 280, 100, "Email Consumer", "SendGrid Worker", frame_id=fid)
    save_and_export(scene, fid, "software_ia", "06_event_driven_architecture")

    # 7. User Flow
    scene, fid, tw, th = create_base_scene("User Flow & Screen Progression", "SOFTWARE & IA")
    VisualTypes27Engine.render_flowchart(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "07_user_flow")

    # 8. Sequence Diagram
    scene, fid, tw, th = create_base_scene("Sequence Diagram (Messages Over Time)", "SOFTWARE & IA")
    VisualTypes27Engine.render_sequence(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "08_sequence_diagram")

    # 9. AI Agent Architecture
    scene, fid, tw, th = create_base_scene("Autonomous AI Agent Architecture", "SOFTWARE & IA")
    scene.add_quad_card(40, 140, 240, 120, "1. Percepcion", "Multimodal Input &\nPrompt Parser", badge="INPUT", frame_id=fid)
    scene.add_arrow(280, 200, 360, 200, stroke="#94A3B8", frame_id=fid)
    
    # Brain (Hero)
    scene.add_rect(360, 70, 480, 280, bg="#FFF5F2", stroke="#D93829", stroke_w=2.0, roundness_type=3, frame_id=fid)
    scene.add_text(380, 95, "NUCLEO DE RAZONAMIENTO (LLM BRAIN)", font_size=12, font_family=3, color="#D93829", frame_id=fid)
    scene.add_quad_card(380, 130, 200, 90, "Short-Term Memory", "Context Window & Scratchpad", frame_id=fid)
    scene.add_quad_card(620, 130, 200, 90, "Long-Term Memory", "Vector DB & Episodic Store", frame_id=fid)
    scene.add_quad_card(460, 235, 280, 90, "Planificador & Auto-Reflexion", "ReAct / Reflexion Loop", is_hero=True, frame_id=fid)
    
    scene.add_arrow(840, 200, 940, 200, stroke="#D93829", stroke_w=1.8, frame_id=fid)
    scene.add_quad_card(940, 140, 260, 120, "3. Herramientas & Actions", "Code Execution, Web Search,\nAPI Tool Calling", badge="TOOL CALLING", frame_id=fid)
    save_and_export(scene, fid, "software_ia", "09_ai_agent_architecture")

    # 10. RAG Architecture
    scene, fid, tw, th = create_base_scene("RAG (Retrieval-Augmented Generation) Pipeline", "SOFTWARE & IA")
    rag_steps = [
        ("1. Ingestion", "PDFs, Docs & Markdown", 40, False),
        ("2. Chunking & Embed", "OpenAI text-embed-3", 320, False),
        ("3. Vector DB", "Qdrant / Milvus Index", 600, True),
        ("4. Retriever", "Hybrid Semantic Search", 880, False),
        ("5. LLM Synthesis", "Grounded Generation", 1160, False)
    ]
    for r_t, r_d, rx, is_h in rag_steps:
        scene.add_quad_card(rx, 140, 240, 120, r_t, r_d, badge="RAG STEP", is_hero=is_h, frame_id=fid)
        if rx < 1160:
            scene.add_arrow(rx + 240, 200, rx + 320, 200, stroke="#D93829" if is_h else "#94A3B8", stroke_w=1.5, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "10_rag_architecture")

    # 11. AI Workflow (Human-in-the-loop)
    scene, fid, tw, th = create_base_scene("AI Workflow (Human-in-the-Loop)", "SOFTWARE & IA")
    VisualTypes27Engine.render_swimlane(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "software_ia", "11_ai_workflow")

    # 12. Prompt Engineering Framework
    scene, fid, tw, th = create_base_scene("Prompt Engineering Structured Framework", "SOFTWARE & IA")
    p_sections = [
        ("1. ROL & SISTEMA", "Actúa como arquitecto de software principal.", 40, 80, 420, 160, False),
        ("2. CONTEXTO & RESTRICCIONES", "Stack: Python 3.11, FastAPI, cero emojis.", 480, 80, 460, 160, False),
        ("3. INSTRUCCION CLARA", "Genera el esquema de base de datos relacional.", 960, 80, 440, 160, True),
        ("4. EJEMPLOS FEW-SHOT", "Input: 'pagos' -> Output: Tabla transactions.", 40, 260, 660, 170, False),
        ("5. FORMATO DE SALIDA", "JSON estricto conforme a schema JSON-LD.", 720, 260, 680, 170, False)
    ]
    for pt, pd, px, py, pw, ph, is_h in p_sections:
        scene.add_rect(px, py, pw, ph, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(px + 20, py + 20, pt, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(px + 20, py + 60, pd, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "software_ia", "12_prompt_engineering_framework")


# ===================================================================================================
# 4. NEGOCIOS & PRODUCTO (10 Plantillas)
# ===================================================================================================

def gen_negocios():
    print("\n--- Generando Plantillas de NEGOCIOS & PRODUCTO ---")

    # 1. Business Model Canvas
    scene, fid, tw, th = create_base_scene("Business Model Canvas (9 Bloques)", "NEGOCIOS")
    bmc_blocks = [
        ("Socios Clave", 40, 80, 260, 230, False),
        ("Actividades Clave", 315, 80, 260, 110, False),
        ("Recursos Clave", 315, 200, 260, 110, False),
        ("Propuesta de Valor", 590, 80, 270, 230, True),
        ("Relacion Clientes", 875, 80, 260, 110, False),
        ("Canales", 875, 200, 260, 110, False),
        ("Segmentos Clientes", 1150, 80, 260, 230, False),
        ("Estructura de Costes", 40, 320, 675, 110, False),
        ("Fuentes de Ingresos", 735, 320, 675, 110, False)
    ]
    for b_title, bx, by, bw, bh, is_h in bmc_blocks:
        scene.add_rect(bx, by, bw, bh, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(bx + 15, by + 15, b_title, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
    save_and_export(scene, fid, "negocios", "01_business_model_canvas")

    # 2. Lean Canvas
    scene, fid, tw, th = create_base_scene("Lean Canvas Startup Framework", "NEGOCIOS")
    lc_blocks = [
        ("Problema", 40, 80, 260, 230, False),
        ("Solucion", 315, 80, 260, 110, False),
        ("Metricas Clave", 315, 200, 260, 110, False),
        ("Propuesta Unica de Valor", 590, 80, 270, 230, True),
        ("Ventaja Injusta", 875, 80, 260, 110, False),
        ("Canales", 875, 200, 260, 110, False),
        ("Segmento de Clientes", 1150, 80, 260, 230, False),
        ("Estructura de Costes", 40, 320, 675, 110, False),
        ("Flujos de Ingresos", 735, 320, 675, 110, False)
    ]
    for b_title, bx, by, bw, bh, is_h in lc_blocks:
        scene.add_rect(bx, by, bw, bh, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(bx + 15, by + 15, b_title, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
    save_and_export(scene, fid, "negocios", "02_lean_canvas")

    # 3. SWOT / FODA
    scene, fid, tw, th = create_base_scene("SWOT / FODA Strategic Matrix", "NEGOCIOS")
    VisualTypes27Engine.render_consultant_2x2(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "negocios", "03_swot_foda")

    # 4. Product Vision Board
    scene, fid, tw, th = create_base_scene("Product Vision Board", "NEGOCIOS")
    pv = [
        ("VISION", "¿Cual es el proposito fundamental del producto?", 40, 80, 1360, 70, True),
        ("GRUPO OBJETIVO", "Desarrolladores e ingenieros de software", 40, 170, 325, 250, False),
        ("NECESIDADES", "Generacion rapida de diagramas limpios sin friccion", 385, 170, 325, 250, False),
        ("PRODUCTO", "Motor autonomo con 27 tipos visuales editoriales", 730, 170, 325, 250, False),
        ("OBJETIVOS DE NEGOCIO", "Adopcion comunitaria y suscripciones enterprise", 1075, 170, 325, 250, False)
    ]
    for pt, pd, px, py, pw, ph, is_h in pv:
        scene.add_rect(px, py, pw, ph, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(px + 15, py + 15, pt, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(px + 15, py + 50, pd, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "negocios", "04_product_vision_board")

    # 5. Product Roadmap (Now, Next, Later)
    scene, fid, tw, th = create_base_scene("Product Roadmap (Now, Next, Later)", "NEGOCIOS")
    cols = [("NOW (Q1 - EN CURSO)", 40, True), ("NEXT (Q2 - PLANIFICADO)", 500, False), ("LATER (Q3/Q4 - VISION)", 960, False)]
    for c_title, cx, is_h in cols:
        scene.add_rect(cx, 80, 440, 350, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(cx + 20, 105, c_title, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_quad_card(cx + 20, 145, 400, 75, "Epic 1", "Descripcion del feature principal", frame_id=fid)
        scene.add_quad_card(cx + 20, 235, 400, 75, "Epic 2", "Optimizacion de rendimiento y UX", frame_id=fid)
    save_and_export(scene, fid, "negocios", "05_product_roadmap")

    # 6. OKR Planner
    scene, fid, tw, th = create_base_scene("OKR Objective & Key Results Planner", "NEGOCIOS")
    scene.add_rect(40, 80, 1360, 100, bg="#FFF5F2", stroke="#D93829", stroke_w=1.8, roundness_type=3, frame_id=fid)
    scene.add_text(60, 105, "OBJETIVO ESTRATEGICO (O1): Convertir Sketion en el motor de referencia para arquitectura", font_size=13, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(60, 140, "Impacto esperado: Duplicar la tasa de retencion y expandir la suite de plantillas.", font_size=11, font_family=3, color="#334155", frame_id=fid)
    
    krs = [
        ("KEY RESULT 1", "Alcanzar 10.000 diagramas generados al mes.", 40),
        ("KEY RESULT 2", "Mantener Visual Consistency Score >= 97/100.", 500),
        ("KEY RESULT 3", "Integrar 62 plantillas curadas en produccion.", 960)
    ]
    for kt, kd, kx in krs:
        scene.add_rect(kx, 200, 440, 220, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(kx + 20, 230, kt, font_size=12, font_family=3, color="#0F172A", frame_id=fid)
        scene.add_text(kx + 20, 275, kd, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "negocios", "06_okr_planner")

    # 7. Decision Matrix
    scene, fid, tw, th = create_base_scene("Weighted Decision Matrix", "NEGOCIOS")
    scene.add_rect(40, 80, 1360, 340, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(60, 105, "CRITERIOS PONDERADOS DE SELECCION TECNOLOGICA", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    d_rows = ["Opcion A (Python Native)", "Opcion B (Node.js Service)", "Opcion C (WebAssembly Client)"]
    for i, dr in enumerate(d_rows):
        is_h = i == 0
        scene.add_rect(60, 145 + i * 80, 1320, 65, bg="#FFF5F2" if is_h else "#F8FAFC", stroke="#D93829" if is_h else "#E2E8F0", stroke_w=1.2, frame_id=fid)
        scene.add_text(80, 170 + i * 80, dr, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(500, 170 + i * 80, "Costo: 9/10  |  Velocidad: 9.5/10  |  Mantenibilidad: 9/10  |  TOTAL: 92/100", font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "negocios", "07_decision_matrix")

    # 8. Eisenhower Matrix
    scene, fid, tw, th = create_base_scene("Eisenhower Priority Matrix", "NEGOCIOS")
    VisualTypes27Engine.render_quadrant(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "negocios", "08_eisenhower_matrix")

    # 9. Stakeholder Map
    scene, fid, tw, th = create_base_scene("Stakeholder Power vs Interest Map", "NEGOCIOS")
    VisualTypes27Engine.render_quadrant(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "negocios", "09_stakeholder_map")

    # 10. Go-To-Market Plan
    scene, fid, tw, th = create_base_scene("Go-To-Market (GTM) Launch Phases", "NEGOCIOS")
    VisualTypes27Engine.render_value_chain(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "negocios", "10_go_to_market_plan")


# ===================================================================================================
# 5. DISEÑO & UX (10 Plantillas)
# ===================================================================================================

def gen_diseno_ux():
    print("\n--- Generando Plantillas de DISEÑO & UX ---")

    # 1. Customer Journey Map
    scene, fid, tw, th = create_base_scene("Customer Journey Map", "DISEÑO & UX")
    c_stages = ["1. DESCUBRIMIENTO", "2. EVALUACION", "3. COMPRA / ONBOARDING", "4. USO ACTIVO", "5. FIDELIZACION"]
    for i, cs in enumerate(c_stages):
        cx = 40 + i * 275
        is_h = i == 2
        scene.add_rect(cx, 80, 260, 350, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(cx + 15, 105, cs, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(cx + 15, 140, "Acciones:\n* Visita landing\n* Prueba playground\n\nPuntos de contacto:\n* Web, GitHub, Docs\n\nEmocion: Positiva", font_size=10, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "01_customer_journey_map")

    # 2. User Journey Map
    scene, fid, tw, th = create_base_scene("User Journey Map de Tarea Especifica", "DISEÑO & UX")
    VisualTypes27Engine.render_swimlane(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "02_user_journey_map")

    # 3. Empathy Map
    scene, fid, tw, th = create_base_scene("Empathy Map (Dice, Piensa, Hace, Siente)", "DISEÑO & UX")
    VisualTypes27Engine.render_consultant_2x2(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "03_empathy_map")

    # 4. Persona Canvas
    scene, fid, tw, th = create_base_scene("User Persona Canvas", "DISEÑO & UX")
    scene.add_rect(40, 80, 380, 350, bg="#FFF5F2", stroke="#D93829", stroke_w=1.8, roundness_type=3, frame_id=fid)
    scene.add_text(60, 105, "PERFIL: ARQUITECTO CLOUD", font_size=13, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(60, 145, "Nombre: Alex Martinez\nEdad: 34 anos\nRol: Principal Cloud Architect\nEmpresa: Fintech B2B\nHerramientas: AWS, Excalidraw, Terraform", font_size=11, font_family=3, color="#334155", frame_id=fid)
    
    scene.add_rect(450, 80, 460, 350, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(470, 105, "METAS & MOTIVACIONES", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(470, 145, "* Comunicar arquitecturas claras a stakeholders.\n* Generar diagramas estandarizados en minutos.\n* Evitar perder tiempo alineando cajas a mano.", font_size=11, font_family=3, color="#475569", frame_id=fid)

    scene.add_rect(940, 80, 460, 350, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(960, 105, "FRUSTRACIONES & DOLORES", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(960, 145, "* Herramientas de diagramacion saturadas de botones.\n* Generadores de IA que crean cajas amontonadas.\n* Falta de soporte para exportar a Excalidraw.", font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "04_persona_canvas")

    # 5. User Flow
    scene, fid, tw, th = create_base_scene("User Flow (Screens & Decisions)", "DISEÑO & UX")
    VisualTypes27Engine.render_flowchart(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "05_user_flow")

    # 6. Wireframe Board
    scene, fid, tw, th = create_base_scene("Low-Fidelity Wireframe Board", "DISEÑO & UX")
    screens = ["Pantalla 1: Home / Catalog", "Pantalla 2: Editor Canvas", "Pantalla 3: Export Modal"]
    for i, sc in enumerate(screens):
        sx = 40 + i * 460
        scene.add_rect(sx, 80, 430, 350, bg="#FFFFFF", stroke="#0F172A", stroke_w=1.8, roundness_type=3, frame_id=fid)
        scene.add_text(sx + 20, 105, sc, font_size=11, font_family=3, color="#0F172A", frame_id=fid)
        scene.add_rect(sx + 20, 140, 390, 40, bg="#F1F5F9", stroke="#CBD5E1", frame_id=fid)
        scene.add_rect(sx + 20, 200, 185, 200, bg="#F8FAFC", stroke="#E2E8F0", frame_id=fid)
        scene.add_rect(sx + 225, 200, 185, 200, bg="#F8FAFC", stroke="#E2E8F0", frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "06_wireframe_board")

    # 7. Design Critique
    scene, fid, tw, th = create_base_scene("Design Critique Canvas", "DISEÑO & UX")
    critique = [
        ("ASPECTOS POSITIVOS", "Excelente jerarquia y uso de color hero.", 40, True),
        ("PREGUNTAS & DUDAS", "¿Como responde la tipografia en pantallas 4:3?", 500, False),
        ("OPORTUNIDADES", "Agregar mayor margen perimetral en tablas.", 960, False)
    ]
    for ct, cd, cx, is_h in critique:
        scene.add_rect(cx, 80, 440, 350, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(cx + 20, 105, ct, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(cx + 20, 150, cd, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "07_design_critique")

    # 8. UX Research Board
    scene, fid, tw, th = create_base_scene("UX Research Findings Board", "DISEÑO & UX")
    VisualTypes27Engine.render_nested(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "08_ux_research_board")

    # 9. Heuristic Evaluation
    scene, fid, tw, th = create_base_scene("Heuristic Evaluation (Nielsen 10)", "DISEÑO & UX")
    heuristics = [
        ("1. Visibilidad del Estado", "PASS (0 - Sin problema)", "Indicadores de carga claros"),
        ("2. Correspondencia Mundo Real", "PASS (0 - Sin problema)", "Terminologia estandar de arquitectura"),
        ("3. Control y Libertad de Usuario", "MINOR (1 - Leve)", "Falta atajo rapido de teclado"),
        ("4. Consistencia y Estandares", "PASS (0 - Sin problema)", "Cumple Design System al 100%")
    ]
    for i, (h_n, h_s, h_d) in enumerate(heuristics):
        hy = 80 + i * 85
        scene.add_rect(40, hy, tw - 80, 70, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(60, hy + 25, h_n, font_size=11, font_family=3, color="#0F172A", frame_id=fid)
        scene.add_text(450, hy + 25, h_s, font_size=11, font_family=3, color="#059669" if "PASS" in h_s else "#D97706", frame_id=fid)
        scene.add_text(780, hy + 25, h_d, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "09_heuristic_evaluation")

    # 10. Design Sprint Board
    scene, fid, tw, th = create_base_scene("Design Sprint 5-Day Board", "DISEÑO & UX")
    sprint_days = ["LUNES: Comprender", "MARTES: Bocetar", "MIERCOLES: Decidir", "JUEVES: Prototipar", "VIERNES: Testear"]
    for i, sd in enumerate(sprint_days):
        sx = 40 + i * 275
        is_h = i == 2
        scene.add_rect(sx, 80, 260, 350, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(sx + 15, 105, sd, font_size=11, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
    save_and_export(scene, fid, "diseno_ux", "10_design_sprint")


# ===================================================================================================
# 6. PRODUCTIVIDAD (10 Plantillas)
# ===================================================================================================

def gen_productividad():
    print("\n--- Generando Plantillas de PRODUCTIVIDAD ---")

    # 1. Kanban Board
    scene, fid, tw, th = create_base_scene("Kanban Workflow Board", "PRODUCTIVIDAD")
    k_cols = ["BACKLOG", "EN PROGRESO", "EN REVISION", "COMPLETADO"]
    for i, kc in enumerate(k_cols):
        kx = 40 + i * 345
        is_h = i == 1
        scene.add_rect(kx, 80, 330, 350, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(kx + 20, 105, kc, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_quad_card(kx + 15, 140, 300, 75, f"Tarea #{i*2+1}", "Descripcion de actividad prioritaria", frame_id=fid)
        scene.add_quad_card(kx + 15, 230, 300, 75, f"Tarea #{i*2+2}", "Validacion y testing de modulo", frame_id=fid)
    save_and_export(scene, fid, "productividad", "01_kanban_board")

    # 2. Weekly Planner
    scene, fid, tw, th = create_base_scene("Weekly Operational Planner", "PRODUCTIVIDAD")
    days = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"]
    for i, d in enumerate(days):
        dx = 40 + i * 275
        scene.add_rect(dx, 80, 260, 350, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(dx + 20, 105, d, font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    save_and_export(scene, fid, "productividad", "02_weekly_planner")

    # 3. Daily Planner
    scene, fid, tw, th = create_base_scene("Daily Focus & Timebox Planner", "PRODUCTIVIDAD")
    scene.add_rect(40, 80, 440, 350, bg="#FFF5F2", stroke="#D93829", stroke_w=1.8, roundness_type=3, frame_id=fid)
    scene.add_text(60, 105, "TOP 3 PRIORIDADES DEL DIA", font_size=12, font_family=3, color="#D93829", frame_id=fid)
    scene.add_text(60, 145, "1. Certificar release v10.0 GA\n2. Generar biblioteca de plantillas\n3. Actualizar documentacion técnica", font_size=11, font_family=3, color="#334155", frame_id=fid)
    
    scene.add_rect(500, 80, 440, 350, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(520, 105, "HORARIO & TIMEBLOCKING", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(520, 145, "08:00 - 10:00: Deep Work (Codigo)\n10:00 - 11:00: Revision de PRs\n11:00 - 12:30: Benchmarks y CI\n14:00 - 16:00: Generacion SVG", font_size=11, font_family=3, color="#475569", frame_id=fid)

    scene.add_rect(960, 80, 440, 350, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(980, 105, "TAREAS SECUNDARIAS & NOTAS", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(980, 145, "[ ] Responder emails pendientes\n[ ] Actualizar branch main\n[ ] Backup de base de datos", font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "productividad", "03_daily_planner")

    # 4. Time Blocking Canvas
    scene, fid, tw, th = create_base_scene("Time Blocking Architecture", "PRODUCTIVIDAD")
    blocks = [
        ("DEEP WORK (ENFOQUE ALTO)", "08:00 - 12:00", "Desarrollo de algoritmos clave y arquitectura", 40, True),
        ("REUNIONES & SINCRONIZACION", "13:00 - 15:00", "Alineacion con stakeholders y equipo", 500, False),
        ("ADMINISTRATIVO & CIERRE", "15:00 - 17:00", "Revision de documentacion y commits", 960, False)
    ]
    for bt, btime, bd, bx, is_h in blocks:
        scene.add_rect(bx, 80, 440, 350, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(bx + 20, 105, bt, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(bx + 20, 145, f"Horario: {btime}\n\nActividades:\n{bd}", font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "productividad", "04_time_blocking")

    # 5. Habit Tracker
    scene, fid, tw, th = create_base_scene("Monthly Habit Tracker", "PRODUCTIVIDAD")
    habits = ["Lectura tecnica (30m)", "Ejercicio fisico (45m)", "Resolucion LeetCode", "Revision de codigo"]
    for i, hb in enumerate(habits):
        hy = 80 + i * 85
        scene.add_rect(40, hy, tw - 80, 70, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(60, hy + 25, hb, font_size=11, font_family=3, color="#0F172A", frame_id=fid)
        for d in range(1, 16):
            scene.add_rect(340 + d * 65, hy + 15, 45, 40, bg="#FFF5F2" if (d+i)%3==0 else "#F1F5F9", stroke="#CBD5E1", frame_id=fid)
            scene.add_text(340 + d * 65 + 15, hy + 28, f"{d}", font_size=9, font_family=3, color="#64748B", frame_id=fid)
    save_and_export(scene, fid, "productividad", "05_habit_tracker")

    # 6. Meeting Notes
    scene, fid, tw, th = create_base_scene("Structured Meeting Notes", "PRODUCTIVIDAD")
    scene.add_rect(40, 80, 1360, 70, bg="#FFF5F2", stroke="#D93829", stroke_w=1.8, roundness_type=3, frame_id=fid)
    scene.add_text(60, 105, "OBJETIVO DE LA REUNION: Alineacion de lanzamiento v10.0 GA y catalogo de plantillas", font_size=12, font_family=3, color="#D93829", frame_id=fid)
    
    scene.add_rect(40, 165, 665, 265, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(60, 190, "PUNTOS DISCUTIDOS & DECISIONES", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(60, 230, "1. Se aprobo la separacion de 'Plantillas de Equipo' por origen.\n2. Se definio el boton destacado 'Crear con IA'.\n3. Se integran 62 plantillas vectoriales puras en SVG y Excalidraw.", font_size=11, font_family=3, color="#475569", frame_id=fid)

    scene.add_rect(735, 165, 665, 265, bg="#FFFFFF", stroke="#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
    scene.add_text(755, 190, "ACUERDOS & RESPONSABLES", font_size=12, font_family=3, color="#0F172A", frame_id=fid)
    scene.add_text(755, 230, "* [Alex] Generar scripts de exportacion SVG (Hoy).\n* [Luis] Validar estructura de carpetas /templates (Hoy).\n* [Equipo] Revision final de calidad visual (Manana).", font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "productividad", "06_meeting_notes")

    # 7. Action Items Matrix
    scene, fid, tw, th = create_base_scene("Action Items & Ownership Matrix", "PRODUCTIVIDAD")
    a_headers = ["ACCION / TAREA", "RESPONSABLE", "PRIORIDAD", "FECHA LIMITE", "ESTADO"]
    a_xs = [40, 480, 750, 950, 1180]
    for ah, ax_pos in zip(a_headers, a_xs):
        scene.add_text(ax_pos, 85, ah, font_size=11, font_family=3, color="#64748B", frame_id=fid)
    a_rows = [
        ("Compilar las 62 plantillas a SVG", "Luis R.", "CRITICA", "17/Ago", "COMPLETADO"),
        ("Crear documentacion /templates/README.md", "Alex M.", "ALTA", "17/Ago", "EN PROGRESO"),
        ("Sincronizar cambios en GitHub origin/main", "Equipo", "ALTA", "17/Ago", "PENDIENTE")
    ]
    for idx, r in enumerate(a_rows):
        ry = 130 + idx * 85
        scene.add_rect(30, ry, tw - 60, 70, bg="#FFF5F2" if idx==0 else "#FFFFFF", stroke="#D93829" if idx==0 else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        for val, ax_pos in zip(r, a_xs):
            scene.add_text(ax_pos, ry + 25, val, font_size=11, font_family=3, color="#D93829" if val in ["CRITICA", "COMPLETADO"] else "#0F172A", frame_id=fid)
    save_and_export(scene, fid, "productividad", "07_action_items")

    # 8. Sprint Retrospective
    scene, fid, tw, th = create_base_scene("Agile Sprint Retrospective", "PRODUCTIVIDAD")
    retro_cols = [
        ("¿QUE FUNCIONO BIEN?", "Velocidad de renderizado (0.002s) y cero colisiones espaciales.", 40, True),
        ("¿QUE PODEMOS MEJORAR?", "Curacion inicial de plantillas destacadas.", 500, False),
        ("ACCIONES CONCRETAS", "Crear la carpeta /templates con las 62 plantillas organizadas.", 960, False)
    ]
    for rt, rd, rx, is_h in retro_cols:
        scene.add_rect(rx, 80, 440, 350, bg="#FFF5F2" if is_h else "#FFFFFF", stroke="#D93829" if is_h else "#CBD5E1", stroke_w=1.5, roundness_type=3, frame_id=fid)
        scene.add_text(rx + 20, 105, rt, font_size=12, font_family=3, color="#D93829" if is_h else "#0F172A", frame_id=fid)
        scene.add_text(rx + 20, 150, rd, font_size=11, font_family=3, color="#475569", frame_id=fid)
    save_and_export(scene, fid, "productividad", "08_sprint_retrospective")

    # 9. Team Alignment Canvas
    scene, fid, tw, th = create_base_scene("Team Alignment Canvas", "PRODUCTIVIDAD")
    VisualTypes27Engine.render_nested(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "productividad", "09_team_alignment")

    # 10. Priority Matrix (Impact vs Effort)
    scene, fid, tw, th = create_base_scene("Priority Matrix (Impact vs Effort)", "PRODUCTIVIDAD")
    VisualTypes27Engine.render_quadrant(scene, 10, 10, tw, th, frame_id=fid)
    save_and_export(scene, fid, "productividad", "10_priority_matrix")


def main():
    print("=" * 110)
    print("INICIANDO GENERACION DE LA BIBLIOTECA CURADA DE PLANTILLAS DE SKETION (62 PLANTILLAS)")
    print("=" * 110)
    gen_estudio()
    gen_ingenieria()
    gen_software_ia()
    gen_negocios()
    gen_diseno_ux()
    gen_productividad()
    print("=" * 110)
    print("COMPILACION EXITOSA DE LAS 62 PLANTILLAS EN: /Users/leonfeliperodriguez/Desktop/Trabajos/Sketion SKILL/templates")
    print("=" * 110)


if __name__ == "__main__":
    main()
