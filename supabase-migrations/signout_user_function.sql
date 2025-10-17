-- Create signout_user function that can only be called by admins
-- This function signs out a user by invalidating their sessions

CREATE OR REPLACE FUNCTION public.signout_user(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_role TEXT;
  result JSON;
  audit_table_exists BOOLEAN;
BEGIN
  SELECT role INTO calling_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF calling_user_role IS NULL OR calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can sign out users';
  END IF;

  DELETE FROM auth.sessions
  WHERE user_id = user_uuid;

  result := json_build_object(
    'success', true,
    'message', 'User signed out successfully',
    'user_id', user_uuid
  );

  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
  ) INTO audit_table_exists;

  IF audit_table_exists THEN
    INSERT INTO public.audit_logs (admin_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'signout_user',
      'user',
      user_uuid::TEXT,
      json_build_object('signed_out_at', NOW())
    );
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.signout_user(UUID) TO authenticated;
