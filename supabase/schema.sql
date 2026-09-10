    -- 1. Tabla de Carpetas
    CREATE TABLE IF NOT EXISTS public.folders (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Habilitar RLS para carpetas
    ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow users to manage their own folders" ON public.folders;
    CREATE POLICY "Allow users to manage their own folders"
        ON public.folders FOR ALL
        USING (auth.uid() = user_id);

    -- 2. Tabla de Tableros
    CREATE TABLE IF NOT EXISTS public.boards (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        elements JSONB NOT NULL,
        app_state JSONB NOT NULL,
        files JSONB NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
        password TEXT,
        is_template BOOLEAN NOT NULL DEFAULT FALSE,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        notes_count INTEGER NOT NULL DEFAULT 0,
        comments_count INTEGER NOT NULL DEFAULT 0,
        collaborators_count INTEGER NOT NULL DEFAULT 0,
        is_collaboration BOOLEAN NOT NULL DEFAULT FALSE,
        room_id TEXT,
        room_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Asegurar que las columnas de metadatos existen en caso de que la tabla ya estuviera creada
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS notes_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS collaborators_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS is_collaboration BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS room_id TEXT;
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS room_key TEXT;

    -- Habilitar RLS para tableros
    ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow users to manage their own boards" ON public.boards;
    DROP POLICY IF EXISTS "Allow owners and members to access boards" ON public.boards;
    CREATE POLICY "Allow owners and members to access boards"
        ON public.boards FOR ALL
        USING (
            auth.uid() = user_id OR
            (
                to_regclass('public.board_members') IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM public.board_members bm
                    WHERE bm.board_id = boards.id AND bm.user_id = auth.uid()
                )
            )
        );

    -- 3. Tabla de Biblioteca Compartida (Formas)
    CREATE TABLE IF NOT EXISTS public.libraries (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        items JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Habilitar RLS para bibliotecas
    ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow users to manage their own library" ON public.libraries;
    CREATE POLICY "Allow users to manage their own library"
        ON public.libraries FOR ALL
        USING (auth.uid() = user_id);

    -- 4. Habilitar Realtime para tableros (boards) en Supabase de forma segura (evita errores si ya existe)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_rel pr 
        JOIN pg_publication p ON p.oid = pr.prpubid 
        JOIN pg_class c ON c.oid = pr.prrelid 
        WHERE p.pubname = 'supabase_realtime' AND c.relname = 'boards'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
      END IF;
    END $$;

    -- 5. Tabla de Enlaces Compartidos (Shared Links - Zero-Knowledge E2E)
    CREATE TABLE IF NOT EXISTS public.shared_links (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- CN-003: Asegurar eliminación de columna encryption_key si existía en esquemas previos
    ALTER TABLE public.shared_links DROP COLUMN IF EXISTS encryption_key;

    -- Habilitar RLS para shared_links
    ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public read access for shared_links" ON public.shared_links;
    CREATE POLICY "Public read access for shared_links"
        ON public.shared_links FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS "Authenticated insert access for shared_links" ON public.shared_links;
    -- CN-003: Only authenticated users can create shared links
    CREATE POLICY "Authenticated insert access for shared_links"
        ON public.shared_links FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);


    -- CN-009: Función de mantenimiento para auto-eliminar enlaces compartidos de más de 30 días con search_path seguro
    CREATE OR REPLACE FUNCTION public.clean_old_shared_links()
    RETURNS void AS $$
    BEGIN
      DELETE FROM public.shared_links
      WHERE created_at < NOW() - INTERVAL '30 days';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

    -- Garantizar que la columna is_template existe en bases de datos ya creadas
    ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;

    -- 6. Tabla de Plantillas del Workspace (Templates)
    CREATE TABLE IF NOT EXISTS public.templates (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        elements JSONB NOT NULL,
        thumbnail TEXT, -- base64 representation of preview
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Habilitar RLS para plantillas
    ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

    -- Todos los usuarios autenticados pueden ver todas las plantillas
    DROP POLICY IF EXISTS "Permitir lectura general a usuarios autenticados" ON public.templates;
    CREATE POLICY "Permitir lectura general a usuarios autenticados" 
        ON public.templates FOR SELECT 
        TO authenticated 
        USING (true);

    -- Solo el creador puede modificar o eliminar sus plantillas
    DROP POLICY IF EXISTS "Permitir gestión de plantillas propias" ON public.templates;
    CREATE POLICY "Permitir gestión de plantillas propias" 
        ON public.templates FOR ALL 
        USING (auth.uid() = user_id);


