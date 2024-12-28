import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// Apply to job ( Candidate )
export async function applyToJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `resume-${random}-${jobData.candidate_id}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, jobData.resume);

  if (storageError) throw new Error("Error uploading Resume");

  const resume = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        ...jobData,
        resume,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Application");
  }

  return data;
}

// Edit application status ( Recruiter )
export async function updateApplicationStatus(token, { job_id }, status) {
  try {
    const supabase = await supabaseClient(token);

    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("job_id", job_id)
      .select();

    if (error) {
      console.error("Error Updating Application Status:", error);
      return null;
    }

    if (data.length === 0) {
      console.warn(
        "No rows updated. Check if job_id exists or status is valid."
      );
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected Error:", err);
    return null;
  }
}

export async function getApplications(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select("*, job: jobs(title, company: companies(name))")
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching Applications:", error);
    return null;
  }

  return data;
}