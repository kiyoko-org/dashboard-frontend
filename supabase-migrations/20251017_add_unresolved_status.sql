-- Add 'unresolved' status to reports table
-- This migration updates the reports_status_check constraint to include the new 'unresolved' status

-- Drop the existing check constraint
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;

-- Add the updated check constraint with 'unresolved' included
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check CHECK (
  (
    status = ANY (
      ARRAY[
        'pending'::text,
        'assigned'::text,
        'in-progress'::text,
        'unresolved'::text,
        'resolved'::text,
        'cancelled'::text
      ]
    )
  )
);
