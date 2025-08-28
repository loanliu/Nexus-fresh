-- Create a separate admin view for admins
CREATE VIEW public.admin_search_documents AS
SELECT 
    d.id,
    d.title,
    d.content,
    d.user_id,
    d.created_at,
    d.updated_at,
    u.email as user_email,
    u.name as user_name
FROM public.documents d
JOIN public.users u ON d.user_id = u.id
WHERE EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
);