/**
 * page.tsx (progress) — Weight trend, adherence, workout log, and progress
 * photos.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeightChart } from "@/components/progress/weight-chart";
import { LogWeightForm } from "@/components/progress/log-weight-form";
import { LogWorkoutForm } from "@/components/progress/log-workout-form";
import { PhotoUpload } from "@/components/progress/photo-upload";
import { countDistinctTrainingDays } from "@/lib/fitness/adherence";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [bodyMetricsResult, workoutLogsResult, progressPhotosResult] = await Promise.all([
    supabase
      .from("body_metrics")
      .select("weight_kg, recorded_at")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: true }),
    supabase
      .from("workout_logs")
      .select("exercise_name, sets, performed_at")
      .eq("user_id", user.id)
      .order("performed_at", { ascending: false })
      .limit(20),
    supabase
      .from("progress_photos")
      .select("id, image_url, recorded_at")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(12),
  ]);

  const bodyMetrics = bodyMetricsResult.data ?? [];
  const workoutLogs = workoutLogsResult.data ?? [];
  const progressPhotos = progressPhotosResult.data ?? [];

  const weightPoints = bodyMetrics.map((row) => ({
    recordedAt: row.recorded_at,
    weightKg: Number(row.weight_kg),
  }));

  const weightChange =
    weightPoints.length >= 2
      ? weightPoints[weightPoints.length - 1].weightKg - weightPoints[0].weightKg
      : null;

  const performedDates = workoutLogs.map((log) => log.performed_at);
  const trainingDaysLast7 = countDistinctTrainingDays(performedDates, 7);
  const trainingDaysLast30 = countDistinctTrainingDays(performedDates, 30);

  const photosWithUrls = await Promise.all(
    progressPhotos.map(async (photo) => {
      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(photo.image_url, SIGNED_URL_TTL_SECONDS);
      return { ...photo, signedUrl: data?.signedUrl };
    }),
  );

  return (
    <div className="flex min-h-svh flex-col">
      <AppNav userEmail={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        <h1 className="text-lg font-semibold">Progress</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weight trend</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <WeightChart data={weightPoints} />
            {weightChange !== null && (
              <p className="text-sm text-muted-foreground">
                {weightChange > 0 ? "+" : ""}
                {weightChange.toFixed(1)} kg since your first log
              </p>
            )}
            <LogWeightForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {trainingDaysLast7} training day(s) logged in the last 7 days ·{" "}
              {trainingDaysLast30} in the last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log a workout</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <LogWorkoutForm />
            {workoutLogs.length > 0 && (
              <div className="flex flex-col gap-2 border-t pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground">Recent logs</h3>
                <ul className="flex flex-col gap-1 text-sm">
                  {workoutLogs.map((log, index) => (
                    <li key={index}>
                      <span className="text-muted-foreground">{log.performed_at}</span> —{" "}
                      <span className="font-medium">{log.exercise_name}</span>{" "}
                      {Array.isArray(log.sets) && log.sets.length > 0 && (
                        <span className="text-muted-foreground">
                          ({(log.sets as string[]).join(", ")})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress photos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <PhotoUpload />
            <div className="grid grid-cols-3 gap-2">
              {photosWithUrls.map(
                (photo) =>
                  photo.signedUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- signed URL from private storage, not a static asset
                    <img
                      key={photo.id}
                      src={photo.signedUrl}
                      alt={`Progress photo from ${photo.recorded_at}`}
                      className="aspect-square rounded-md border object-cover"
                    />
                  ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
