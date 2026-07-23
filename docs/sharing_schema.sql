-- ==========================================================
-- LIBROVIA PREMIUM SHARED LIBRARY SCHEMAS
-- ==========================================================

-- 1. CREATE BOOK SHARES TABLE
CREATE TABLE IF NOT EXISTS public.book_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_book_recipient UNIQUE (book_id, recipient_id)
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.book_shares ENABLE ROW LEVEL SECURITY;

-- 3. APPLY ROW LEVEL SECURITY POLICIES
DROP POLICY IF EXISTS "Users can view shares they own or received" ON public.book_shares;
CREATE POLICY "Users can view shares they own or received"
    ON public.book_shares
    FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can insert shares for books they own" ON public.book_shares;
CREATE POLICY "Users can insert shares for books they own"
    ON public.book_shares
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update shares they received (accept/decline) or own (remove access)" ON public.book_shares;
CREATE POLICY "Users can update shares they received (accept/decline) or own (remove access)"
    ON public.book_shares
    FOR UPDATE
    USING (auth.uid() = owner_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can delete shares they own (remove access) or received (remove from library)" ON public.book_shares;
CREATE POLICY "Users can delete shares they own (remove access) or received (remove from library)"
    ON public.book_shares
    FOR DELETE
    USING (auth.uid() = owner_id OR auth.uid() = recipient_id);

-- 4. UPDATE BOOKS SELECT POLICY TO ENABLE SHARED ACCESS
-- Drop current select policy
DROP POLICY IF EXISTS "Allow users to read their own books" ON public.books;
DROP POLICY IF EXISTS "Allow users to read their own or shared books" ON public.books;

-- Recreate to grant SELECT access if user is the owner OR if there exists an active share with the user
CREATE POLICY "Allow users to read their own or shared books"
    ON public.books
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.book_shares 
            WHERE book_shares.book_id = books.id 
              AND book_shares.recipient_id = auth.uid() 
              AND book_shares.status = 'accepted'
        )
    );
