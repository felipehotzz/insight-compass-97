-- Update the handle_new_user function to use the invitation role if available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
  invitation_role app_role;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Check if user has a pending invitation
  SELECT role INTO invitation_role
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'accepted'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Determine role: use invitation role if exists, otherwise first user is admin, rest are viewer
  IF invitation_role IS NOT NULL THEN
    assigned_role := invitation_role;
  ELSIF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'viewer';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$function$;