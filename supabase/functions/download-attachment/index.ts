import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttachmentRequest {
  emailId: string;
  attachmentId: string;
  filename: string;
  messageId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailId, attachmentId, filename, messageId }: AttachmentRequest = await req.json();

    console.log("Download attachment request:", { emailId, attachmentId, filename, messageId });

    if (!attachmentId || !filename) {
      throw new Error("Missing required fields: attachmentId, filename");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if file already exists in storage
    const storagePath = `${messageId}/${attachmentId}/${filename}`;
    
    const { data: existingFile } = await supabase.storage
      .from("email-attachments")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (existingFile?.signedUrl) {
      console.log("File already exists in storage, returning existing URL");
      return new Response(
        JSON.stringify({
          success: true,
          url: existingFile.signedUrl,
          cached: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Download attachment from Resend API
    console.log("Downloading attachment from Resend...");
    const resendResponse = await fetch(
      `https://api.resend.com/emails/receiving/attachments/${attachmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
        },
      }
    );

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, errorText);
      throw new Error(`Failed to download attachment from Resend: ${resendResponse.status}`);
    }

    // Get the file content as blob
    const fileBlob = await resendResponse.blob();
    const contentType = resendResponse.headers.get("content-type") || "application/octet-stream";
    
    console.log("Downloaded attachment:", {
      size: fileBlob.size,
      contentType,
    });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("email-attachments")
      .upload(storagePath, fileBlob, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload attachment to storage: ${uploadError.message}`);
    }

    console.log("Uploaded to storage:", uploadData);

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("email-attachments")
      .getPublicUrl(storagePath);

    // Update email_messages to mark attachments as downloaded
    if (messageId) {
      await supabase
        .from("email_messages")
        .update({ attachments_downloaded: true })
        .eq("id", messageId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl.publicUrl,
        cached: false,
        storagePath,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error downloading attachment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
