-- Allow anonymous users to read invitations by token (needed for invite flow)
CREATE POLICY "Anyone can view pending invitations by token"
ON public.invitations
FOR SELECT
TO anon
USING (status = 'pending');