
-- Check if the user_role enum exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_type 
    WHERE typname = 'user_role'
) as enum_exists;

-- Check if the profiles table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
) as profiles_table_exists;

-- Check if the trigger function exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'handle_new_user'
) as function_exists;

-- Check if the trigger exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
) as trigger_exists;
