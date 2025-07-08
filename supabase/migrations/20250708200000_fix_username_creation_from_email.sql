-- Update the handle_new_user function to use email prefix as username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  email_prefix text;
BEGIN
  -- Extract the part before @ from email
  email_prefix := split_part(new.email, '@', 1);
  
  -- Ensure the username is at least 3 characters long
  -- If email prefix is too short, append numbers
  IF char_length(email_prefix) < 3 THEN
    email_prefix := email_prefix || '123';
  END IF;
  
  -- Insert profile with email prefix as username
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, email_prefix);
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- If username already exists, append a random number
    INSERT INTO public.profiles (id, username)
    VALUES (new.id, email_prefix || floor(random() * 1000)::text);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;