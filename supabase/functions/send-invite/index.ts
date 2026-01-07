import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  emails: string[];
  role: string;
  invitedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing invite request...");

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User verified:", user.id);

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || userRole?.role !== "admin") {
      console.error("User is not admin:", roleError);
      return new Response(
        JSON.stringify({ error: "Only admins can send invites" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { emails, role, invitedBy }: InviteRequest = await req.json();
    console.log("Inviting emails:", emails, "with role:", role);

    const baseUrl = req.headers.get("origin") || "https://comunica.in";
    const results = [];

    for (const email of emails) {
      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from("invitations")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .eq("status", "pending")
        .single();

      if (existingInvite) {
        console.log("Invitation already exists for:", email);
        results.push({ email, status: "already_invited" });
        continue;
      }

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (existingProfile) {
        console.log("User already exists:", email);
        results.push({ email, status: "already_registered" });
        continue;
      }

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .insert({
          email: email.trim().toLowerCase(),
          role: role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        results.push({ email, status: "error", error: inviteError.message });
        continue;
      }

      console.log("Invitation created:", invitation.id);

      // Send email
      const inviteUrl = `${baseUrl}/auth?invite=${invitation.token}`;

      try {
        const emailResponse = await resend.emails.send({
          from: "Compass <noreply@compass.comunica.in>",
          to: [email.trim()],
          subject: "Você foi convidado para o Compass Comunica.In",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Você foi convidado!</h1>
                      <p style="color: #666; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
                        Você recebeu um convite para fazer parte do workspace no Comunica.in como <strong>${role}</strong>.
                      </p>
                      <p style="color: #666; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                        Clique no botão abaixo para aceitar o convite e criar sua conta:
                      </p>
                      <a href="${inviteUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        Aceitar Convite
                      </a>
                      <p style="color: #999; font-size: 14px; line-height: 20px; margin-top: 30px;">
                        Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este e-mail.
                      </p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
        });

        console.log("Email sent successfully:", emailResponse);
        results.push({ email, status: "sent", invitationId: invitation.id });
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        results.push({ email, status: "email_error", error: emailError.message });
      }
    }

    console.log("Invite results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
