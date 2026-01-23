-- Add color column to projects table
ALTER TABLE public.projects 
ADD COLUMN color text DEFAULT '#FF7900';