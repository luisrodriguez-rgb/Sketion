-- Schema SQL para el Sistema de Roles en My-Excalidraw

-- 1. Crear el enum de roles
DO $$ BEGIN
    CREATE TYPE public.board_role AS ENUM ('owner', 'editor', 'commenter', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear la tabla de miembros de pizarras
CREATE TABLE IF NOT EXISTS public.board_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id TEXT NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.board_role NOT NULL DEFAULT 'editor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT board_members_board_user_unique UNIQUE (board_id, user_id)
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Políticas para board_members
DROP POLICY IF EXISTS "Members can view members of their boards" ON public.board_members;
CREATE POLICY "Members can view members of their boards"
    ON public.board_members FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.boards b
                WHERE b.id = board_members.board_id AND b.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Board owners can manage members" ON public.board_members;
CREATE POLICY "Board owners can manage members"
    ON public.board_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.boards b
            WHERE b.id = board_members.board_id AND b.user_id = auth.uid()
        )
    );
