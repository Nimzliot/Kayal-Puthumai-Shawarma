import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const bucketName = "product-images";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { user };
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) {
    return adminCheck.error;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { error: bucketError } = await adminClient.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: "5MB"
  });

  if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
    return NextResponse.json({ error: bucketError.message }, { status: 500 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const filePath = `${adminCheck.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await adminClient.storage
    .from(bucketName)
    .upload(filePath, fileBytes, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = adminClient.storage.from(bucketName).getPublicUrl(filePath);

  return NextResponse.json({
    success: true,
    imageUrl: data.publicUrl
  });
}
