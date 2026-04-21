import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { z } from "https://esm.sh/zod@3.23.8";

const ContactSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(5000),
});

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const TO_EMAIL = Deno.env.get("CONTACT_TO_EMAIL");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!TO_EMAIL) throw new Error("CONTACT_TO_EMAIL not configured");

    const json = await req.json();
    const parsed = ContactSchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { full_name, email, message } = parsed.data;

    // Save to database (service role bypasses RLS but our INSERT policy already allows anon)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({ full_name, email, message });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Don't fail the whole request — still try to send email
    }

    // Send email via Resend
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 16px">New contact message</h2>
        <p style="margin:0 0 8px"><strong>From:</strong> ${escapeHtml(full_name)} &lt;${escapeHtml(email)}&gt;</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(message)}</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Studio.nx Contact <onboarding@resend.dev>",
        to: [TO_EMAIL],
        reply_to: email,
        subject: `New message from ${full_name}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-contact-email error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
