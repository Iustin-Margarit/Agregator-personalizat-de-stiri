-- Revoke the old, insecure policies
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;

-- Create a new, more secure policy for uploads
CREATE POLICY "Authenticated users can upload avatars."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    (metadata ->> 'size')::bigint < 2097152 AND -- 2MB limit
    (metadata ->> 'mimetype') IN ('image/png', 'image/jpeg') -- Allowed mime types
  );

-- Create a new, more secure policy for updates
CREATE POLICY "Authenticated users can update their own avatars."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (metadata ->> 'size')::bigint < 2097152 AND
    (metadata ->> 'mimetype') IN ('image/png', 'image/jpeg')
  );