-- Add column to store CSV preview (first rows as JSON)
ALTER TABLE public.import_history 
ADD COLUMN csv_preview jsonb DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.import_history.csv_preview IS 'Stores the first 20 rows of the imported CSV for preview purposes';