-- Drop the faulty insert policy that was checking metadata before it was available.
DROP POLICY IF EXISTS "Authenticated users can upload avatars." ON storage.objects;

-- Recreate the insert policy, removing the metadata checks which are not valid on INSERT.
-- The policy still ensures users can only upload to their own folder.
CREATE POLICY "Authenticated users can upload avatars."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );