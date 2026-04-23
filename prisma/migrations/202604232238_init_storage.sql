-- 1. Create a public bucket for media
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policies for 'media' bucket
DO $$
BEGIN
    -- Public Access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'media' );
    END IF;

    -- Authenticated Upload
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
            bucket_id = 'media' 
            AND auth.role() = 'authenticated'
        );
    END IF;

    -- Authenticated Update
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (
            bucket_id = 'media' 
            AND auth.role() = 'authenticated'
        );
    END IF;

    -- Authenticated Delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (
            bucket_id = 'media' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;
