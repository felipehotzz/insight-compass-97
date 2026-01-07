-- Insert default permissions for tickets for all roles
INSERT INTO public.role_permissions (role, page, can_view)
VALUES 
  ('admin', 'tickets', true),
  ('editor', 'tickets', true),
  ('viewer', 'tickets', false),
  ('customer_success', 'tickets', true),
  ('growth', 'tickets', false);