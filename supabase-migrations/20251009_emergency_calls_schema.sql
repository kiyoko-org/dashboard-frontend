-- Create emergency_calls table for logging emergency calls
CREATE TABLE public.emergency_calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  called_number TEXT NOT NULL,
  caller_number TEXT,
  call_type TEXT CHECK (call_type IN ('police', 'fire', 'medical', 'general')) DEFAULT 'general',
  call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location_lat FLOAT,
  location_lng FLOAT,
  outcome TEXT DEFAULT 'initiated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_calls ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting emergency calls (authenticated users can create calls)
CREATE POLICY "Users can insert their own emergency calls" ON public.emergency_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for selecting emergency calls (authenticated users can view only their calls)
CREATE POLICY "Users can view their own emergency calls" ON public.emergency_calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for updating emergency calls (authenticated users can update only their calls)
CREATE POLICY "Users can update their own emergency calls" ON public.emergency_calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for deleting emergency calls (authenticated users can delete only their calls)
CREATE POLICY "Users can delete their own emergency calls" ON public.emergency_calls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Optional: Admin policy for dashboard to view all emergency calls
-- Uncomment and modify based on your admin role implementation
-- CREATE POLICY "Admins can view all emergency calls" ON public.emergency_calls
--   FOR SELECT
--   TO authenticated
--   USING (auth.jwt() ->> 'role' = 'admin');
