import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttachmentRequest {
  attachmentId: string;
  filename: string;
  messageId: string;
  emailId?: string; // Resend email ID (from message_id field)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attachmentId, filename, messageId, emailId }: AttachmentRequest = await req.json();

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

    // Get the Resend email ID from the database if not provided
    let resendEmailId = emailId;
    if (!resendEmailId && messageId) {
      const { data: emailMessage } = await supabase
        .from("email_messages")
        .select("message_id")
        .eq("id", messageId)
        .single();
      
      if (emailMessage?.message_id) {
        // Extract Resend email ID from message_id (format: <resend-id@resend.dev>)
        const match = emailMessage.message_id.match(/<([^@]+)@/);
        resendEmailId = match ? match[1] : emailMessage.message_id;
      }
    }

    if (!resendEmailId) {
      throw new Error("Could not determine Resend email ID for attachment download");
    }

    console.log("Using Resend email ID:", resendEmailId);

    // First, get attachment info to obtain download_url
    console.log("Getting attachment info from Resend...");
    const attachmentInfoResponse = await fetch(
      `https://api.resend.com/emails/receiving/${resendEmailId}/attachments/${attachmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
        },
      }
    );

    if (!attachmentInfoResponse.ok) {
      const errorText = await attachmentInfoResponse.text();
      console.error("Resend attachment info error:", attachmentInfoResponse.status, errorText);
      throw new Error(`Failed to get attachment info from Resend: ${attachmentInfoResponse.status}`);
    }

    const attachmentInfo = await attachmentInfoResponse.json();
    console.log("Attachment info:", attachmentInfo);

    if (!attachmentInfo.download_url) {
      throw new Error("No download_url in attachment info");
    }

    // Download the file using the download_url
    console.log("Downloading attachment from:", attachmentInfo.download_url);
    const resendResponse = await fetch(attachmentInfo.download_url);

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Download error:", resendResponse.status, errorText);
      throw new Error(`Failed to download attachment: ${resendResponse.status}`);
    }

    // Get the file content as blob
    const fileBlob = await resendResponse.blob();
    const contentType = attachmentInfo.content_type || resendResponse.headers.get("content-type") || "application/octet-stream";
    
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
