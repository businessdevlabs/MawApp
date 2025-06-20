
-- First, let's add the missing foreign key relationships that are causing the build errors
-- Add foreign key from bookings to profiles (client_id)
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_client_id 
FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from service_providers to profiles (user_id)
ALTER TABLE public.service_providers 
ADD CONSTRAINT fk_service_providers_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from bookings to service_providers (provider_id)
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_provider_id 
FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;

-- Add foreign key from bookings to services (service_id)
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

-- Add foreign key from services to service_providers (provider_id)
ALTER TABLE public.services 
ADD CONSTRAINT fk_services_provider_id 
FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;

-- Add foreign key from services to service_categories (category_id)
ALTER TABLE public.services 
ADD CONSTRAINT fk_services_category_id 
FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE SET NULL;

-- Add foreign key from reviews to bookings (booking_id)
ALTER TABLE public.reviews 
ADD CONSTRAINT fk_reviews_booking_id 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Add foreign key from reviews to profiles (client_id)
ALTER TABLE public.reviews 
ADD CONSTRAINT fk_reviews_client_id 
FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from reviews to service_providers (provider_id)
ALTER TABLE public.reviews 
ADD CONSTRAINT fk_reviews_provider_id 
FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;

-- Make sure the trigger function is working correctly - let's recreate it with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'::user_role)
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
